import { useState } from 'react'
import { BookOpen, Edit2, Trash2, ShieldCheck } from 'lucide-react'
import ConditionBadge from '../components/ConditionBadge'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { usePageFocus } from '../hooks/usePageFocus'

export default function MyListings({ isActive, onOpenBook, onEditBook }) {
  const { user } = useAuth()
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState(null)

  usePageFocus(isActive, () => { if (user) fetchMyBooks() })

  async function fetchMyBooks() {
    setLoading(true)
    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('seller_id', user.id)
      .in('status', ['available', 'reserved'])
      .order('created_at', { ascending: false })
    if (data) setBooks(data)
    setLoading(false)
  }

  async function handleRemove(bookId) {
    if (!confirm('Remove this listing?')) return
    setRemoving(bookId)
    await supabase.from('books').update({ status: 'removed' }).eq('id', bookId)
    setBooks((prev) => prev.filter((b) => b.id !== bookId))
    setRemoving(null)
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <div className="bg-navy px-4 pt-5 pb-4 sticky top-0 z-20">
        <h1 className="font-display font-bold text-white text-lg">My Listings</h1>
        <p className="text-white/50 text-xs mt-0.5">{books.length} active book{books.length !== 1 ? 's' : ''}</p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3 px-4 pt-4">
          {[1,2,3].map((i) => <div key={i} className="h-24 bg-white rounded-card border border-border animate-pulse" />)}
        </div>
      )}

      {!loading && books.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <BookOpen size={40} className="text-muted/40 mb-3" />
          <p className="font-display font-semibold text-navy text-sm">No active listings</p>
          <p className="text-xs text-muted mt-1">Tap + on the home screen to post your first book</p>
        </div>
      )}

      <div className="flex flex-col gap-3 px-4 pt-4">
        {books.map((book) => (
          <div key={book.id} className="bg-white rounded-card border border-border shadow-sm overflow-hidden">
            <div
              className="flex items-center gap-3 p-3 cursor-pointer active:bg-cream transition-colors"
              onClick={() => onOpenBook?.(book)}
            >
              <div className="w-16 h-16 rounded-button bg-orange/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden relative">
                {book.images?.[0] ? <img src={book.images[0]} alt="" className="w-full h-full object-cover" /> : '📘'}
                {book.video_url && (
                  <span className="absolute bottom-0 left-0 right-0 bg-navy/80 text-white text-[8px] font-bold text-center py-0.5 flex items-center justify-center gap-0.5">
                    <ShieldCheck size={8} /> Verified
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm text-navy truncate">{book.title}</p>
                {book.author && <p className="text-xs text-muted truncate">by {book.author}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="font-display font-bold text-sm text-orange">₹{book.price}</span>
                  <ConditionBadge level={book.condition} />
                </div>
              </div>
            </div>
            {/* Action bar */}
            <div className="flex border-t border-border divide-x divide-border">
              <button
                onClick={() => onEditBook?.(book)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-navy hover:bg-cream transition-colors"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={() => handleRemove(book.id)}
                disabled={removing === book.id}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-danger hover:bg-danger-bg transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} /> {removing === book.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
