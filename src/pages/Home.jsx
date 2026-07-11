import { useState, useEffect, useMemo } from 'react'
import { Search, BookOpen, ShieldCheck, MessageCircle } from 'lucide-react'
import Logo from '../components/Logo'
import ConditionBadge from '../components/ConditionBadge'
import NotificationBell from '../components/NotificationBell'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePageFocus } from '../hooks/usePageFocus'

const CATEGORIES = ['All', 'Engineering', 'Commerce', 'Science', 'Medical', 'Arts', 'Other']

export default function Home({ isActive, onOpenPost, onOpenBook, onOpenInbox, unreadCount = 0, notifications = [], onMarkRead }) {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [blockedIds, setBlockedIds] = useState([])

  usePageFocus(isActive, () => {
    fetchBooks()
    fetchBlockedUsers()
  })

  async function fetchBooks() {
    setLoading(true)
    const { data, error } = await supabase
      .from('books')
      .select('*, profiles:seller_id (full_name, rating_avg, college)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })

    if (!error && data) setBooks(data)
    setLoading(false)
  }

  async function fetchBlockedUsers() {
    if (!user) return
    const { data } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id)
    if (data) setBlockedIds(data.map((b) => b.blocked_id))
  }

  const filteredBooks = useMemo(() => {
    return books
      .filter((b) => !blockedIds.includes(b.seller_id)) // hide blocked sellers' books
      .filter((b) => activeCategory === 'All' || b.category === activeCategory)
      .filter((b) => {
        if (!search.trim()) return true
        const q = search.toLowerCase()
        return (
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.subject?.toLowerCase().includes(q)
        )
      })
  }, [books, activeCategory, search, blockedIds])

  return (
    <div className="min-h-screen bg-cream pb-20">
      {/* Top nav */}
      <div className="bg-navy px-4 pt-5 pb-4 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <Logo size="sm" dark />
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenInbox}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center active:scale-95 transition-transform relative"
            >
              <MessageCircle size={16} className="text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationBell
              unreadCount={unreadCount}
              notifications={notifications}
              onMarkRead={onMarkRead}
              onOpenInbox={onOpenInbox}
            />
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 mt-5">
        <div className="bg-white rounded-card px-4 py-3 flex items-center gap-3 shadow-sm border border-border">
          <Search size={16} className="text-muted shrink-0" />
          <input
            type="text"
            placeholder="Search books, subjects, authors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm w-full outline-none placeholder:text-muted/70 text-navy"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto scrollbar-hide pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 text-xs font-semibold font-display px-4 py-2 rounded-chip whitespace-nowrap transition-colors ${
              activeCategory === cat
                ? 'bg-orange text-white'
                : 'bg-white text-navy border border-border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Section label */}
      <div className="flex items-center justify-between px-4 mt-6 mb-3">
        <h2 className="font-display font-bold text-navy text-base">
          {search ? 'Search Results' : 'Fresh Listings'}
        </h2>
        <span className="text-xs text-muted font-medium">
          {loading ? '…' : `${filteredBooks.length} books`}
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-2 gap-3 px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-card overflow-hidden border border-border animate-pulse">
              <div className="h-24 bg-navy/5" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-navy/5 rounded w-full" />
                <div className="h-3 bg-navy/5 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book grid */}
      {!loading && filteredBooks.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-4">
          {filteredBooks.map((book) => (
            <button
              key={book.id}
              onClick={() => onOpenBook?.(book)}
              className="bg-white rounded-card overflow-hidden shadow-sm border border-border active:scale-[0.98] transition-transform text-left"
            >
              <div className="h-24 bg-orange/5 flex items-center justify-center relative overflow-hidden">
                {book.images?.[0] ? (
                  <img src={book.images[0]} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">📘</span>
                )}
                {book.video_url && (
                  <span className="absolute top-1.5 left-1.5 bg-navy/90 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-chip flex items-center gap-1">
                    <ShieldCheck size={9} /> Verified
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="font-medium text-xs text-navy leading-snug line-clamp-2 h-8">
                  {book.title}
                </p>
                <div className="flex items-baseline gap-1.5 mt-2">
                  <span className="font-display font-bold text-sm text-orange">₹{book.price}</span>
                  {book.original_price && (
                    <span className="text-[10px] text-muted line-through">₹{book.original_price}</span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <ConditionBadge level={book.condition} />
                  {book.profiles?.rating_avg > 0 && (
                    <span className="text-[9px] text-muted font-medium">
                      ⭐ {book.profiles.rating_avg}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredBooks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <BookOpen size={40} className="text-muted/40 mb-3" />
          <p className="font-display font-semibold text-navy text-sm">
            {search ? 'No books match your search' : 'No books yet'}
          </p>
          <p className="text-xs text-muted mt-1">
            {search ? 'Try a different keyword' : 'Be the first to post a book in your college'}
          </p>
        </div>
      )}

      {/* Floating post button */}
      <button
        onClick={onOpenPost}
        className="fixed bottom-20 right-5 bg-orange text-white rounded-full w-14 h-14 shadow-xl shadow-orange/30 flex items-center justify-center text-2xl font-bold active:scale-90 transition-transform z-30"
      >
        +
      </button>
    </div>
  )
}
