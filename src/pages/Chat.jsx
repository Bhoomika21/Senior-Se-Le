import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, Send, ShieldAlert, MoreVertical, Flag, ShieldOff, Star, Ban } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

function containsPhoneNumber(text) {
  const digitsOnly = text.replace(/[^0-9]/g, '')
  return digitsOnly.length >= 10 && /(\d[\s-]?){10,}/.test(text)
}

export default function Chat({ book, existingConversation, onBack, onReportUser, onBlockUser, onRateUser, onMarkRead }) {
  const { user } = useAuth()
  const [conversation, setConversation] = useState(existingConversation || null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [warning, setWarning] = useState('')
  const [otherProfile, setOtherProfile] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [iBlockedThem, setIBlockedThem] = useState(false)
  const [theyBlockedMe, setTheyBlockedMe] = useState(false)
  const scrollRef = useRef(null)
  const channelRef = useRef(null)

  useEffect(() => {
    initConversation()
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current)
    }
  }, [book?.id, existingConversation?.id])

  useEffect(() => {
    if (!conversation) return
    fetchMessages()
    subscribeToMessages()
  }, [conversation?.id])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function initConversation() {
    setLoading(true)

    let otherId = null

    if (existingConversation) {
      otherId = existingConversation.buyer_id === user.id
        ? existingConversation.seller_id
        : existingConversation.buyer_id
      setConversation(existingConversation)
    } else if (book) {
      otherId = book.seller_id
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('book_id', book.id)
        .eq('buyer_id', user.id)
        .maybeSingle()

      if (existing) {
        setConversation(existing)
      } else {
        const { data: created } = await supabase
          .from('conversations')
          .insert({ book_id: book.id, buyer_id: user.id, seller_id: book.seller_id })
          .select()
          .single()
        if (created) setConversation(created)
      }
    }

    if (otherId) {
      const [profileRes, iBlockedRes, theyBlockedRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', otherId).single(),
        supabase.from('blocks').select('id').eq('blocker_id', user.id).eq('blocked_id', otherId).maybeSingle(),
        supabase.from('blocks').select('id').eq('blocker_id', otherId).eq('blocked_id', user.id).maybeSingle(),
      ])
      if (profileRes.data) setOtherProfile(profileRes.data)
      setIBlockedThem(!!iBlockedRes.data)
      setTheyBlockedMe(!!theyBlockedRes.data)
    }

    setLoading(false)
  }

  // Fetch messages — DB policy already filters out post-block messages
  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    onMarkRead?.()
  }

  function subscribeToMessages() {
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`,
        },
        async (payload) => {
          const msg = payload.new
          // Double-check: if this message is from the other person,
          // re-query block status and ignore if blocked
          if (msg.sender_id !== user.id) {
            const { data: blockCheck } = await supabase
              .from('blocks')
              .select('id')
              .eq('blocker_id', user.id)
              .eq('blocked_id', msg.sender_id)
              .maybeSingle()
            if (blockCheck) return // blocked — ignore
          }
          setMessages((prev) => [...prev, msg])
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || !conversation) return
    if (iBlockedThem || theyBlockedMe) return

    if (containsPhoneNumber(input)) {
      setWarning("For your safety, phone numbers can't be shared in chat.")
      return
    }
    setWarning('')
    const content = input.trim()
    setInput('')

    const { error } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
    })
    if (error) {
      setWarning('Message failed to send. Try again.')
      setInput(content) // restore input if failed
    }
  }

  async function handleBlockFromMenu() {
    setMenuOpen(false)
    setIBlockedThem(true)
    onBlockUser?.(otherProfile)
  }

  const isBlocked = iBlockedThem || theyBlockedMe

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-sm text-muted">Loading chat…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="bg-navy px-4 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={onBack} className="text-white">
          <ChevronLeft size={22} />
        </button>
        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center font-display font-bold text-white text-xs shrink-0">
          {otherProfile?.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-semibold text-white text-sm truncate">
            {otherProfile?.full_name || 'User'}
          </p>
          <p className="text-[10px] text-white/50 truncate">{book?.title || 'Conversation'}</p>
        </div>
        {!isBlocked && (
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="text-white/70 p-1">
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 bg-white rounded-card shadow-xl border border-border overflow-hidden z-30 w-44">
                <button
                  onClick={() => { setMenuOpen(false); onRateUser?.(otherProfile) }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-navy active:bg-cream"
                >
                  <Star size={14} /> Rate this user
                </button>
                <button
                  onClick={() => { setMenuOpen(false); onReportUser?.(otherProfile) }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-navy active:bg-cream border-t border-border"
                >
                  <Flag size={14} /> Report user
                </button>
                <button
                  onClick={handleBlockFromMenu}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-medium text-danger active:bg-cream border-t border-border"
                >
                  <ShieldOff size={14} /> Block user
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Banner */}
      {isBlocked ? (
        <div className="bg-danger-bg px-4 py-3 flex items-center gap-2">
          <Ban size={14} className="text-danger shrink-0" />
          <p className="text-[11px] text-navy leading-snug font-medium">
            {iBlockedThem
              ? `You've blocked ${otherProfile?.full_name || 'this user'}. Go to Profile → Blocked Users to unblock.`
              : `${otherProfile?.full_name || 'This user'} has blocked you. You can no longer send messages.`}
          </p>
        </div>
      ) : (
        <div className="bg-warning-bg px-4 py-2.5 flex items-center gap-2">
          <ShieldAlert size={13} className="text-warning shrink-0" />
          <p className="text-[10px] text-navy leading-snug">
            Keep chats on Senior Se Le — don't share phone numbers or move off-platform.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 px-4 py-4 flex flex-col gap-2.5 overflow-y-auto">
        {messages.length === 0 && !isBlocked && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-sm text-muted">Say hi! Ask about condition, pickup, or anything else.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === user.id
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-card px-4 py-2.5 text-sm leading-relaxed ${
                isMine
                  ? 'bg-orange text-white rounded-br-md'
                  : 'bg-white text-navy border border-border rounded-bl-md'
              }`}>
                {msg.content}
              </div>
            </div>
          )
        })}
        <div ref={scrollRef} />
      </div>

      {warning && (
        <div className="bg-danger-bg text-danger text-xs font-medium px-4 py-2.5 mx-4 rounded-button mb-2">
          {warning}
        </div>
      )}

      {/* Input — hidden when blocked */}
      {!isBlocked && (
        <form onSubmit={handleSend} className="px-4 py-3 bg-cream border-t border-border flex items-center gap-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 bg-white border border-border rounded-button px-4 py-3 text-sm outline-none focus:border-orange transition-colors placeholder:text-muted/60"
          />
          <button
            type="submit"
            className="w-11 h-11 rounded-button bg-orange flex items-center justify-center shrink-0 active:scale-90 transition-transform"
          >
            <Send size={16} className="text-white" />
          </button>
        </form>
      )}
    </div>
  )
}
