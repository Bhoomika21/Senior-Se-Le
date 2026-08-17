import { useState } from 'react'
import { ChevronLeft, ShieldCheck, Flag, MessageCircle, Trash2, Edit2, Star, Share2, MapPin } from 'lucide-react'
import Button from '../components/Button'
import ConditionBadge from '../components/ConditionBadge'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function BookDetail({ book, onBack, onChat, onReport, onEdit, onRemoved }) {
  const { user } = useAuth()
  const [activeMedia, setActiveMedia] = useState(0)
  const [removing, setRemoving] = useState(false)

  if (!book) return null

  const isOwner = user?.id === book.seller_id
  const media = [...(book.images || []), ...(book.video_url ? [{ video: book.video_url }] : [])]
  const platformFee = Math.max(8, Math.round(Number(book.price) * 0.02))

  async function handleRemove() {
    if (!confirm('Remove this listing? This cannot be undone.')) return
    setRemoving(true)
    const { error } = await supabase.from('books').update({ status: 'removed' }).eq('id', book.id)
    setRemoving(false)
    if (!error) onRemoved?.()
  }

  function handleShare() {
    const conditionLabel = ['', 'Heavily Used', 'Worn', 'Fair', 'Good', 'Like New'][book.condition]
    const text = `📚 *${book.title}* for ₹${book.price}\nCondition: ${conditionLabel}${book.profiles?.city ? `\n📍 ${book.profiles.city}` : ''}\n\nCheck it out on Senior Se Le 👇\nhttps://senior-se-le-one.vercel.app`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-cream pb-28">
      {/* Header */}
      <div className="bg-navy px-4 pt-5 pb-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-white"><ChevronLeft size={22} /></button>
          <h1 className="font-display font-bold text-white text-base">Book Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare} className="text-white/70"><Share2 size={18} /></button>
          {!isOwner && (
            <button onClick={() => onReport?.(book)} className="text-white/70"><Flag size={18} /></button>
          )}
        </div>
      </div>

      {/* Media gallery */}
      <div className="relative bg-navy/5 aspect-square">
        {media.length > 0 ? (
          media[activeMedia]?.video ? (
            <video src={media[activeMedia].video} controls className="w-full h-full object-contain bg-black" />
          ) : (
            <img src={media[activeMedia]} alt={book.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl">📘</div>
        )}
        {book.video_url && (
          <span className="absolute top-3 left-3 bg-navy/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-chip flex items-center gap-1">
            <ShieldCheck size={11} /> Verified Condition
          </span>
        )}
      </div>

      {/* Thumbnails */}
      {media.length > 1 && (
        <div className="flex gap-2 px-4 pt-3 overflow-x-auto scrollbar-hide">
          {media.map((m, idx) => (
            <button key={idx} onClick={() => setActiveMedia(idx)}
              className={`shrink-0 w-14 h-14 rounded-button overflow-hidden border-2 ${activeMedia === idx ? 'border-orange' : 'border-border'}`}>
              {m?.video ? (
                <div className="w-full h-full bg-navy flex items-center justify-center text-white text-xs">▶</div>
              ) : (
                <img src={m} alt="" className="w-full h-full object-cover" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="px-4 pt-5 flex flex-col gap-5">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display font-bold text-xl text-navy leading-tight">{book.title}</h1>
            <ConditionBadge level={book.condition} size="md" />
          </div>
          {book.author && <p className="text-sm text-muted mt-1">by {book.author}</p>}
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-display font-bold text-3xl text-orange">₹{book.price}</span>
          {book.original_price && (
            <>
              <span className="text-sm text-muted line-through">₹{book.original_price}</span>
              <span className="text-xs font-semibold text-success bg-success-bg px-2 py-0.5 rounded-chip">
                {Math.round((1 - book.price / book.original_price) * 100)}% off
              </span>
            </>
          )}
        </div>

        {book.description && (
          <div>
            <h3 className="font-display font-semibold text-sm text-navy mb-1.5">Description</h3>
            <p className="text-sm text-muted leading-relaxed">{book.description}</p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {book.category && <span className="text-xs font-semibold text-navy bg-white border border-border px-3 py-1.5 rounded-chip">{book.category}</span>}
          {book.subject && <span className="text-xs font-semibold text-navy bg-white border border-border px-3 py-1.5 rounded-chip">{book.subject}</span>}
        </div>

        {/* Seller card — shows city prominently */}
        <div className="bg-white rounded-card border border-border p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-navy/10 flex items-center justify-center font-display font-bold text-navy text-sm shrink-0">
            {book.profiles?.full_name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-sm text-navy truncate">
              {isOwner ? 'You' : book.profiles?.full_name || 'Seller'}
            </p>
            <p className="text-xs text-muted truncate">{book.profiles?.college || 'College not set'}</p>
            {book.profiles?.city && (
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={10} className="text-orange shrink-0" />
                <span className="text-xs text-orange font-medium">{book.profiles.city}</span>
              </div>
            )}
          </div>
          {book.profiles?.rating_avg > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              <Star size={13} className="text-warning fill-warning" />
              <span className="text-xs font-semibold text-navy">{book.profiles.rating_avg}</span>
              <span className="text-[10px] text-muted">({book.profiles.rating_count})</span>
            </div>
          )}
        </div>

        {/* Beta fee */}
        {!isOwner && (
          <div className="bg-navy/5 rounded-card p-4 flex justify-between items-center text-xs">
            <span className="text-muted">Platform fee</span>
            <div className="flex items-center gap-2">
              <span className="line-through text-muted/50">₹{platformFee}</span>
              <span className="text-[9px] font-bold text-success bg-success-bg px-2 py-0.5 rounded-chip">Waived during beta 🎉</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur border-t border-border px-4 py-4">
        {isOwner ? (
          <div className="flex gap-3">
            <Button variant="subtle" size="lg" className="flex-1" icon={Edit2} onClick={() => onEdit?.(book)}>Edit</Button>
            <Button variant="danger" size="lg" className="flex-1" icon={Trash2} onClick={handleRemove} disabled={removing}>
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          </div>
        ) : (
          <Button variant="primary" size="lg" className="w-full" icon={MessageCircle} onClick={() => onChat?.(book)}>
            Chat with Seller
          </Button>
        )}
      </div>
    </div>
  )
}
