import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useNotifications(userId) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const conversationIds = useRef([])
  const channelRef = useRef(null)

  useEffect(() => {
    if (!userId) return
    fetchUnread()
    fetchConversations()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [userId])

  async function fetchConversations() {
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

    if (!data) return
    conversationIds.current = data.map((c) => c.id)
    subscribeToMessages()
  }

  async function fetchUnread() {
    const seenAt = localStorage.getItem(`ssl_seen_${userId}`) || new Date(0).toISOString()

    const { data: convData } = await supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)

    if (!convData || convData.length === 0) {
      setUnreadCount(0)
      return
    }

    // Get blocked user IDs so we exclude their messages
    const { data: blockedData } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId)

    const blockedIds = blockedData?.map((b) => b.blocked_id) || []

    const ids = convData.map((c) => c.id)
    let query = supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', ids)
      .neq('sender_id', userId)
      .gt('created_at', seenAt)

    // Exclude messages from blocked users
    if (blockedIds.length > 0) {
      query = query.not('sender_id', 'in', `(${blockedIds.join(',')})`)
    }

    const { count } = await query
    setUnreadCount(count || 0)
  }

  function subscribeToMessages() {
    if (conversationIds.current.length === 0) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)

    const channel = supabase
      .channel(`unread-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const msg = payload.new
          if (msg.sender_id !== userId && conversationIds.current.includes(msg.conversation_id)) {
            // Check if sender is blocked before counting
            const { data: blockCheck } = await supabase
              .from('blocks')
              .select('id')
              .eq('blocker_id', userId)
              .eq('blocked_id', msg.sender_id)
              .maybeSingle()

            if (blockCheck) return // blocked — don't count or notify

            const seenAt = localStorage.getItem(`ssl_seen_${userId}`) || new Date(0).toISOString()
            if (new Date(msg.created_at) > new Date(seenAt)) {
              setUnreadCount((n) => n + 1)
              setNotifications((prev) => [msg, ...prev].slice(0, 20))
              triggerBrowserNotification(msg)
            }
          }
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  async function triggerBrowserNotification(msg) {
    if (!('Notification' in window)) return
    if (Notification.permission === 'denied') return

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return
    }

    new Notification('New message on Senior Se Le', {
      body: msg.content?.length > 80 ? msg.content.slice(0, 80) + '…' : msg.content,
      icon: '/icon-192.png',
      tag: `msg-${msg.conversation_id}`,
      renotify: true,
    })
  }

  function markAllRead() {
    const now = new Date().toISOString()
    localStorage.setItem(`ssl_seen_${userId}`, now)
    setUnreadCount(0)
    setNotifications([])
  }

  return { unreadCount, notifications, markAllRead, refetch: fetchUnread }
}
