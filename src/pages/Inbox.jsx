import { useState } from 'react'
import { ChevronLeft, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePageFocus } from '../hooks/usePageFocus'

export default function Inbox({ isActive, onBack, onOpenConversation, onMarkRead }) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  usePageFocus(isActive, () => {
    fetchConversations()
    onMarkRead?.()
  })

  async function fetchConversations() {
    setLoading(true)
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        book:book_id (id, title, images, price, seller_id),
        buyer:buyer_id (id, full_name),
        seller:seller_id (id, full_name)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (!error && data) setConversations(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-cream pb-20">
      <div className="bg-navy px-4 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={onBack} className="text-white">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display font-bold text-white text-base">Messages</h1>
      </div>

      {loading && (
        <div className="px-4 pt-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white rounded-card border border-border animate-pulse" />
          ))}
        </div>
      )}

      {!loading && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <MessageCircle size={36} className="text-muted/40 mb-3" />
          <p className="font-display font-semibold text-navy text-sm">No conversations yet</p>
          <p className="text-xs text-muted mt-1">
            Chats with buyers and sellers will show up here
          </p>
        </div>
      )}

      <div className="px-4 pt-4 flex flex-col gap-2.5">
        {conversations.map((conv) => {
          const isBuyer = conv.buyer_id === user.id
          const otherPerson = isBuyer ? conv.seller : conv.buyer
          return (
            <button
              key={conv.id}
              onClick={() => onOpenConversation(conv)}
              className="bg-white rounded-card border border-border p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
            >
              <div className="w-12 h-12 rounded-button bg-orange/10 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                {conv.book?.images?.[0] ? (
                  <img src={conv.book.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  '📘'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm text-navy truncate">
                  {otherPerson?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted truncate">{conv.book?.title}</p>
              </div>
              <span className="text-xs font-display font-bold text-orange shrink-0">
                ₹{conv.book?.price}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
