import { useState, useEffect } from 'react'
import { ChevronLeft, LogOut, Star, BookOpen, ShieldCheck, Edit2, MessageSquarePlus, UserX, MapPin, Loader, CheckCircle, X, AlertCircle } from 'lucide-react'
import ConditionBadge from '../components/ConditionBadge'
import Button from '../components/Button'
import FeedbackModal from '../components/FeedbackModal'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePageFocus } from '../hooks/usePageFocus'
import { pinToLatLng } from '../lib/pincode'

const TABS = ['Sold', 'Ratings']

export default function Profile({ isActive, onBack, onOpenBook, onEditBook }) {
  const { user, profile, signOut, updateProfile } = useAuth()
  const [tab, setTab] = useState('Sold')
  const [sold, setSold] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showBlocked, setShowBlocked] = useState(false)
  const [blockedUsers, setBlockedUsers] = useState([])
  const [blockedLoading, setBlockedLoading] = useState(false)

  // Location edit state
  const [editingLocation, setEditingLocation] = useState(false)
  const [newCity, setNewCity] = useState('')
  const [newPin, setNewPin] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinResolved, setPinResolved] = useState(null)
  const [pinError, setPinError] = useState('')
  const [locationSaving, setLocationSaving] = useState(false)

  usePageFocus(isActive, () => { if (user) fetchAll() })

  async function fetchAll() {
    setLoading(true)
    const [soldRes, ratingsRes] = await Promise.all([
      supabase.from('books').select('*').eq('seller_id', user.id).eq('status', 'sold').order('created_at', { ascending: false }),
      supabase.from('ratings').select('*, rater:rater_id(full_name, college)').eq('rated_user_id', user.id).order('created_at', { ascending: false }),
    ])
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
    const { error } = await supabase.from('blocks').delete().eq('id', blockId).eq('blocker_id', user.id)
    if (!error) setBlockedUsers((prev) => prev.filter((b) => b.id !== blockId))
  }

  // Open location modal — ALWAYS pre-fill from current profile
  function openLocationEdit() {
    setNewCity(profile?.city || '')
    setNewPin('')
    setPinResolved(null)
    setPinError('')
    setEditingLocation(true)
  }

  async function handlePinChange(val) {
    const cleaned = val.replace(/\D/g, '').slice(0, 6)
    setNewPin(cleaned)
    setPinError('')
    setPinResolved(null)

    if (cleaned.length === 6) {
      setPinLoading(true)
      const result = await pinToLatLng(cleaned)
      setPinLoading(false)
      if (result) {
        setPinResolved(result)
        // Auto-fill city if user hasn't typed one yet
        if (!newCity.trim()) {
          setNewCity(result.district)
        }
      } else {
        setPinError('Invalid PIN code. Please check and try again.')
      }
    }
  }

  async function saveLocation() {
    if (!newCity.trim()) return
    setLocationSaving(true)

    const updates = {
      city: newCity.trim(),
      lat: pinResolved?.lat ?? profile?.lat ?? null,
      lng: pinResolved?.lng ?? profile?.lng ?? null,
    }

    await updateProfile(updates)

    // Also update lat/lng on all this user's active books
    if (pinResolved?.lat && pinResolved?.lng) {
      await supabase
        .from('books')
        .update({
          city: newCity.trim(),
          lat: pinResolved.lat,
          lng: pinResolved.lng,
        })
        .eq('seller_id', user.id)
        .eq('status', 'available')
    }

    setLocationSaving(false)
    setEditingLocation(false)
  }

  const avgRating = ratings.length
    ? (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1)
    : null

  // Blocked users screen
  if (showBlocked) {
    return (
      <div className="min-h-screen bg-cream pb-24">
        <div className="bg-navy px-4 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-20">
          <button onClick={() => setShowBlocked(false)} className="text-white"><ChevronLeft size={22} /></button>
          <h1 className="font-display font-bold text-white text-base">Blocked Users</h1>
        </div>
        <div className="px-4 pt-5">
          {blockedLoading && (
            <div className="flex flex-col gap-3">
              {[1,2].map(i => <div key={i} className="h-16 bg-white rounded-card border border-border animate-pulse" />)}
            </div>
          )}
          {!blockedLoading && blockedUsers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <UserX size={36} className="text-muted/40 mb-3" />
              <p className="font-display font-semibold text-navy text-sm">No blocked users</p>
              <p className="text-xs text-muted mt-1">Users you block will appear here</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            {blockedUsers.map((b) => (
              <div key={b.id} className="bg-white rounded-card border border-border p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center font-display font-bold text-navy text-sm shrink-0">
                  {b.blocked?.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold text-sm text-navy truncate">{b.blocked?.full_name || 'Unknown user'}</p>
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
          <button onClick={onBack} className="text-white"><ChevronLeft size={22} /></button>
          <h1 className="font-display font-bold text-white text-base">My Profile</h1>
          <button onClick={signOut} className="text-white/70"><LogOut size={18} /></button>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange flex items-center justify-center font-display font-bold text-white text-2xl shadow-lg">
            {profile?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display font-bold text-white text-lg leading-tight truncate">
              {profile?.full_name || 'Your Name'}
            </h2>
            <p className="text-white/60 text-xs mt-0.5 truncate">{profile?.college || 'College not set'}</p>
            <button onClick={openLocationEdit} className="flex items-center gap-1 mt-1.5 group">
              <MapPin size={11} className="text-orange shrink-0" />
              <span className="text-orange text-xs font-medium">
                {profile?.city || 'Add your city'}
              </span>
              <Edit2 size={10} className="text-white/30 ml-1 group-hover:text-white/60 transition-colors" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-5">
          <div className="flex-1 bg-white/10 rounded-card p-3 text-center">
            <p className="font-display font-bold text-white text-lg">{sold.length}</p>
            <p className="text-[10px] text-white/50 mt-0.5">Sold</p>
          </div>
          <div className="flex-1 bg-white/10 rounded-card p-3 text-center">
            <p className="font-display font-bold text-white text-lg">
              {avgRating ? `⭐ ${avgRating}` : '—'}
            </p>
            <p className="text-[10px] text-white/50 mt-0.5">{ratings.length} ratings</p>
          </div>
        </div>
      </div>

      {/* Location edit modal */}
      {editingLocation && (
        <div
          className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-end justify-center"
          onClick={(e) => e.target === e.currentTarget && setEditingLocation(false)}
        >
          <div className="bg-white w-full max-w-lg rounded-t-[28px] px-5 pt-5 pb-10 shadow-2xl">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-navy text-base">Update Location</h2>
              <button onClick={() => setEditingLocation(false)} className="text-muted">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* City — always pre-filled */}
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5 font-display">City / Area</label>
                <input
                  type="text"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  placeholder="e.g. Mumbai, Pune, Surat"
                  className="w-full bg-cream border border-border rounded-button px-4 py-3 text-sm text-navy outline-none focus:border-orange transition-colors"
                />
              </div>

              {/* Current location display */}
              {profile?.city && !pinResolved && (
                <div className="flex items-center gap-2 bg-navy/5 rounded-button px-3 py-2.5">
                  <MapPin size={13} className="text-orange shrink-0" />
                  <p className="text-xs text-navy">
                    Current: <span className="font-semibold">{newCity || profile.city}</span>
                    {profile.lat ? ' (with PIN location)' : ' (no PIN set yet)'}
                  </p>
                </div>
              )}

              {/* PIN code */}
              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5 font-display">
                  PIN Code <span className="text-muted font-normal">(for distance filtering)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newPin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    placeholder={profile?.lat ? 'Enter new PIN to update' : 'e.g. 395001'}
                    maxLength={6}
                    className={`w-full bg-cream border rounded-button px-4 py-3 text-sm text-navy outline-none transition-colors pr-10 ${
                      pinError ? 'border-danger' : pinResolved ? 'border-success' : 'border-border focus:border-orange'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {pinLoading && <Loader size={16} className="text-muted animate-spin" />}
                    {!pinLoading && pinResolved && <CheckCircle size={16} className="text-success" />}
                    {!pinLoading && pinError && <AlertCircle size={16} className="text-danger" />}
                  </div>
                </div>
                {pinError && <p className="text-xs text-danger mt-1 flex items-center gap-1"><AlertCircle size={11} /> {pinError}</p>}
                {pinResolved && (
                  <p className="text-[11px] text-success mt-1">
                    ✓ {pinResolved.display}
                  </p>
                )}
                {!profile?.lat && !pinResolved && (
                  <p className="text-[10px] text-muted mt-1">
                    Without a PIN code, distance filtering won't work for your listings
                  </p>
                )}
              </div>

              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={saveLocation}
                disabled={locationSaving || !newCity.trim()}
              >
                {locationSaving ? 'Saving…' : 'Save Location'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white border-b border-border sticky top-0 z-10">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-xs font-display font-semibold transition-colors ${tab === t ? 'text-orange border-b-2 border-orange' : 'text-muted'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {loading && (
          <div className="flex flex-col gap-3">
            {[1,2].map(i => <div key={i} className="h-20 bg-white rounded-card border border-border animate-pulse" />)}
          </div>
        )}

        {/* Sold tab */}
        {!loading && tab === 'Sold' && (
          sold.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck size={32} className="text-muted/40 mb-3" />
              <p className="font-display font-semibold text-navy text-sm">No sold books yet</p>
              <p className="text-xs text-muted mt-1">Completed sales will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sold.map((book) => (
                <div
                  key={book.id}
                  onClick={() => onOpenBook?.(book)}
                  className="bg-white rounded-card border border-border p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="w-14 h-14 rounded-button bg-orange/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                    {book.images?.[0] ? <img src={book.images[0]} alt="" className="w-full h-full object-cover" /> : '📘'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-semibold text-sm text-navy truncate">{book.title}</p>
                    <p className="text-orange font-display font-bold text-sm mt-0.5">₹{book.price}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-chip bg-navy/10 text-navy">Sold</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Ratings tab */}
        {!loading && tab === 'Ratings' && (
          ratings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Star size={32} className="text-muted/40 mb-3" />
              <p className="font-display font-semibold text-navy text-sm">No ratings yet</p>
              <p className="text-xs text-muted mt-1">Complete transactions to receive ratings</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {ratings.map((r) => (
                <div key={r.id} className="bg-white rounded-card border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-display font-semibold text-sm text-navy">{r.rater?.full_name || 'Anonymous'}</p>
                      <p className="text-[10px] text-muted">{r.rater?.college}</p>
                    </div>
                    <div className="flex">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={13} className={s <= r.stars ? 'text-warning fill-warning' : 'text-border fill-border'} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-xs text-muted leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {/* Bottom buttons */}
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

        <p className="text-center text-[10px] text-muted pb-4">
          Senior Se Le · Beta v1.0 · Made with ❤️ for students
        </p>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}
