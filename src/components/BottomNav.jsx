import { Home, User, MessageCircle, PlusSquare } from 'lucide-react'

const TABS = [
  { key: 'home', icon: Home, label: 'Home' },
  { key: 'inbox', icon: MessageCircle, label: 'Messages' },
  { key: 'post', icon: PlusSquare, label: 'Sell' },
  { key: 'profile', icon: User, label: 'Profile' },
]

export default function BottomNav({ active, onNavigate, unreadCount = 0 }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40 flex">
      {TABS.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => onNavigate(key)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors relative ${
            active === key ? 'text-orange' : 'text-muted'
          }`}
        >
          <div className="relative">
            <Icon size={20} strokeWidth={active === key ? 2.5 : 1.8} />
            {key === 'inbox' && unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <span className={`text-[9px] font-display font-semibold ${active === key ? 'text-orange' : 'text-muted'}`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  )
}
