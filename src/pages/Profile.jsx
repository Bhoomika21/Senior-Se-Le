import { useState, useEffect } from 'react'
import { ChevronLeft, LogOut, Star, BookOpen, ShieldCheck, Edit2, MessageSquarePlus, ShieldOff, UserX } from 'lucide-react'
import ConditionBadge from '../components/ConditionBadge'
import Button from '../components/Button'
import FeedbackModal from '../components/FeedbackModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePageFocus } from '../hooks/usePageFocus'

const TABS = ['Selling', 'Sold', 'Ratings']

export default function Profile({ isActive, onBack, onOpenBook, onEditBook }) {
  const { user, profile, signOut } = useAuth()
  const [tab, setTab] = useState('Selling')
  const [listings, setListings] = useState([])
  const [sold, setSold] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [blockedLoading, setBlockedLoading] = useState(false)

  usePageFocus(isActive, () => {
    if (user) fetchAll()
  })

  async function fetchAll() {
    setLoading(true)
    const [listingsRes, soldRes, ratingsRes] = await Promise.all([
      supabase.from('books').select('*').eq('seller_id', user.id).eq('status', 'available').order('created_at', { ascending: false }),
      supabase.from('books').select('*').eq('seller_id', user.id).eq('status', 'sold').order('created_at', { ascending: false }),
      supabase.from('ratings').select('*, rater:rater_id(full_name, college)').eq('rated_user_id', user.id).order('created_at', { ascending: false }),
    ])
    if (listingsRes.data) setListings(listingsRes.data)
    if (soldRes.data) setSold(soldRes.data)
    if (ratingsRes.data) setRatings(ratingsRes.data)
    setLoading(false)
  }

  async function fetchBlockedUsers() {
    setBlockedLoading(true)
    const { data } = await supabase
      .from('blocks')
      .select('id, blocked_id, blocked:blocked_id(full_name, college)')
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setBlockedUsers(data)
    setBlockedLoading(false)
  }

  async function handleUnblock(blockId) {
    const { error } = await supabase
      .from('blocks')
      .delete()
      .eq('id', blockId)
      .eq('blocker_id', user.id)
    if (!error) {
      setBlockedUsers((prev) => prev.filter((b) => b.id !== blockId))
    } else {
      console.error('Unblock error:', error)
    }
  }

  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
    : null

  async function handleSignOut() {
    await signOut()
  }

  // ── Blocked Users Screen ──
  if (showBlocked) {
    return (
      <div className="min-h-screen bg-cream pb-24">
        <div className="bg-navy px-4 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setShowBlocked(false)} className="text-white">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-display font-bold text-white text-base">Blocked Users</h1>
        </div>

        <div className="px-4 pt-5">
          {blockedLoading && (
            <div className="flex flex-col gap-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-white rounded-card border border-border animate-pulse" />
              ))}
            </div>
          )}

          {!blockedLoading && blockedUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <ShieldOff size={36} className="text-muted/40 mb-3" />
              <p className="font-display font-semibold text-navy text-sm">No blocked users</p>
              <p className="text-xs text-muted mt-1">Users you block will appear here</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {blockedUsers.map((b) => (
              <div
                key={b.id}
                className="bg-white rounded-card border border-border p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center font-display font-bold text-navy text-sm shrink-0">
                  {b.blocked?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm text-navy truncate">
                    {b.blocked?.full_name || 'Unknown user'}
                  </p>
                  <p className="text-[11px] text-muted truncate">{b.blocked?.college}</p>
                </div>
                <button
                  onClick={() => handleUnblock(b.id)}
                  className="shrink-0 text-xs font-display font-bold text-orange border border-orange px-3 py-1.5 rounded-chip active:scale-95 transition-transform"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      {/* Header */}
      <div className="bg-navy px-4 pt-5 pb-8">
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack} className="text-white">
            <ChevronLeft size={22} />
          </button>
          <h1 className="font-display font-bold text-white text-base">My Profile</h1>
          <button onClick={handleSignOut} className="text-white/70">
            <LogOut size={18} />
          </button>
        </div>

        {/* Profile card */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange flex items-center justify-center font-display font-bold text-white text-2xl shadow-lg">
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-white text-lg leading-tight truncate">
              {profile?.full_name || 'Your Name'}
            </h2>
            <p className="text-white/60 text-xs mt-0.5 truncate">{profile?.college || 'College not set'}</p>
            <p className="text-white/50 text-xs mt-0.5 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1 bg-white/10 rounded-card p-3 text-center">
            <p className="font-display font-bold text-white text-lg">{listings.length}</p>
            <p className="text-[10px] text-white/50 mt-0.5">Active</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-card p-3 text-center">
            <p className="font-display font-bold text-white text-lg">{sold.length}</p>
            <p className="text-[10px] text-white/50 mt-0.5">Sold</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-card p-3 text-center">
            <p className="font-display font-bold text-white text-lg">
              {avgRating ? (
                <span className="flex items-center justify-center gap-1">
                  ⭐ {avgRating}
                </span>
              ) : '—'}
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">{ratings.length} ratings</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-border sticky top-0 z-10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-xs font-display font-semibold transition-colors ${
              tab === t
                ? 'text-orange border-b-2 border-orange'
                : 'text-muted'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 pt-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-white rounded-card border border-border animate-pulse" />
            ))}
          </div>
        )}

        {/* Selling tab */}
        {!loading && tab === 'Selling' && (
          <>
            {listings.length === 0 ? (
              <EmptyState icon={<BookOpen size={32} className="text-muted/40" />} message="No active listings" sub="Tap + on the home screen to post your first book" />
            ) : (
              <div className="flex flex-col gap-3">
                {listings.map((book) => (
                  <BookRow
                    key={book.id}
                    book={book}
                    onTap={() => onOpenBook?.(book)}
                    action={
                      <button
                        onClick={() => onEditBook?.(book)}
                        className="text-orange"
                      >
                        <Edit2 size={16} />
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Sold tab */}
        {!loading && tab === 'Sold' && (
          <>
            {sold.length === 0 ? (
              <EmptyState icon={<ShieldCheck size={32} className="text-muted/40" />} message="No sold books yet" sub="Completed sales will appear here" />
            ) : (
              <div className="flex flex-col gap-3">
                {sold.map((book) => (
                  <BookRow key={book.id} book={book} badge="Sold" badgeColor="text-success bg-success-bg" />
                ))}
              </div>
            )}
          </>
        )}

        {/* Ratings tab */}
        {!loading && tab === 'Ratings' && (
          <>
            {ratings.length === 0 ? (
              <EmptyState icon={<Star size={32} className="text-muted/40" />} message="No ratings yet" sub="Complete transactions to receive ratings" />
            ) : (
              <div className="flex flex-col gap-3">
                {ratings.map((r) => (
                  <div key={r.id} className="bg-white rounded-card border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-display font-semibold text-sm text-navy">
                          {r.rater?.full_name || 'Anonymous'}
                        </p>
                        <p className="text-[10px] text-muted">{r.rater?.college}</p>
                      </div>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={13}
                            className={s <= r.stars ? 'text-warning fill-warning' : 'text-border fill-border'}
                          />
                        ))}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-muted leading-relaxed">{r.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Feedback button */}
        <div className="mt-8 flex flex-col gap-2.5 mb-4">
          <button
            onClick={() => setShowFeedback(true)}
            className="w-full flex items-center gap-3 bg-white border border-border rounded-card px-4 py-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-orange/10 flex items-center justify-center shrink-0">
              <MessageSquarePlus size={17} className="text-orange" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm text-navy">Share your feedback</p>
              <p className="text-[11px] text-muted mt-0.5">Help us improve Senior Se Le for everyone</p>
            </div>
            <span className="ml-auto text-muted text-lg">›</span>
          </button>

          <button
            onClick={() => { fetchBlockedUsers(); setShowBlocked(true) }}
            className="w-full flex items-center gap-3 bg-white border border-border rounded-card px-4 py-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="w-9 h-9 rounded-xl bg-danger/10 flex items-center justify-center shrink-0">
              <UserX size={17} className="text-danger" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm text-navy">Blocked Users</p>
              <p className="text-[11px] text-muted mt-0.5">Manage who you've blocked</p>
            </div>
            <span className="ml-auto text-muted text-lg">›</span>
          </button>
        </div>

        {/* App version / legal */}
        <p className="text-center text-[10px] text-muted pb-4">
          Senior Se Le · Beta v1.0 · Made with ❤️ for students
        </p>
      </div>

      {/* Feedback modal */}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}

function BookRow({ book, onTap, action, badge, badgeColor }) {
  return (
    <div
      onClick={onTap}
      className="bg-white rounded-card border border-border p-3 flex items-center gap-3 text-left active:scale-[0.98] transition-transform w-full cursor-pointer"
    >
      <div className="w-14 h-14 rounded-button bg-orange/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
        {book.images?.[0] ? (
          <img src={book.images[0]} alt="" className="w-full h-full object-cover" />
        ) : '📘'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm text-navy truncate">{book.title}</p>
        <p className="text-orange font-display font-bold text-sm mt-0.5">₹{book.price}</p>
        {badge ? (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-chip mt-1 inline-block ${badgeColor}`}>
            {badge}
          </span>
        ) : (
          <ConditionBadge level={book.condition} />
        )}
      </div>
      {action && (
        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      )}
    </div>
  )
}

function EmptyState({ icon, message, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon}
      <p className="font-display font-semibold text-navy text-sm mt-3">{message}</p>
      <p className="text-xs text-muted mt-1 max-w-xs leading-relaxed">{sub}</p>
    </div>
  )
}
