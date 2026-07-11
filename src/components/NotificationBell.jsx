import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'

export default function NotificationBell({ unreadCount, notifications, onMarkRead, onOpenInbox }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleOutsideClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  function handleOpen() {
    setOpen((o) => !o)
    if (!open) onMarkRead?.()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 transition-transform relative"
      >
        <Bell size={16} className="text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-72 bg-white rounded-card shadow-2xl border border-border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-display font-bold text-sm text-navy">Notifications</p>
            {notifications.length > 0 && (
              <button
                onClick={onMarkRead}
                className="text-[10px] font-semibold text-orange"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs text-muted">No new notifications</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border max-h-72 overflow-y-auto">
              {notifications.map((msg, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setOpen(false)
                    onOpenInbox?.()
                  }}
                  className="px-4 py-3 text-left active:bg-cream"
                >
                  <p className="text-[11px] font-semibold text-navy mb-0.5">New message</p>
                  <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                    {msg.content}
                  </p>
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-border">
            <button
              onClick={() => {
                setOpen(false)
                onOpenInbox?.()
              }}
              className="w-full py-3 text-xs font-semibold text-orange text-center"
            >
              Open Inbox →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
