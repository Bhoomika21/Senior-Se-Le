import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import Button from '../components/Button'
import StarInput from '../components/StarInput'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const QUICK_TAGS = [
  'Smooth transaction',
  'Book as described',
  'Quick responder',
  'Friendly',
  'On time',
]

export default function RateUser({ book, ratedUserId, ratedUserName, onBack, onSubmitted }) {
  const { user } = useAuth()
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleTag(tag) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  async function handleSubmit() {
    setError('')
    if (stars === 0) {
      setError('Please select a star rating')
      return
    }

    setLoading(true)
    const fullComment = [tags.join(', '), comment].filter(Boolean).join(' — ')

    const { error } = await supabase.from('ratings').insert({
      book_id: book.id,
      rater_id: user.id,
      rated_user_id: ratedUserId,
      stars,
      comment: fullComment || null,
    })

    setLoading(false)
    if (error) {
      setError(error.message?.includes('duplicate') ? 'You already rated this transaction' : 'Could not submit rating')
    } else {
      onSubmitted?.()
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="bg-navy px-4 pt-5 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-white">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display font-bold text-white text-base">Rate Transaction</h1>
      </div>

      <div className="px-6 pt-8 flex flex-col gap-6">
        <div className="text-center">
          <p className="text-sm text-muted">How was your experience with</p>
          <p className="font-display font-bold text-lg text-navy mt-0.5">
            {ratedUserName || 'this user'}?
          </p>
          {book?.title && <p className="text-xs text-muted mt-1">for "{book.title}"</p>}
        </div>

        <StarInput value={stars} onChange={setStars} size={36} />

        {stars > 0 && (
          <>
            <div>
              <p className="text-xs font-semibold text-navy font-display mb-2 text-center">
                What went well? (optional)
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`text-xs font-semibold font-display px-3.5 py-2 rounded-chip transition-colors ${
                      tags.includes(tag)
                        ? 'bg-orange text-white'
                        : 'bg-white text-navy border border-border'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment (optional)…"
              rows={3}
              className="w-full bg-white border border-border rounded-button px-4 py-3 text-sm text-navy outline-none focus:border-orange transition-colors placeholder:text-muted/60 resize-none"
            />
          </>
        )}

        {error && (
          <div className="bg-danger-bg text-danger text-xs font-medium rounded-button px-4 py-3">
            {error}
          </div>
        )}

        <Button variant="primary" size="lg" className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Rating'}
        </Button>
      </div>
    </div>
  )
}
