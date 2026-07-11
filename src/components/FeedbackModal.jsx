import { useState } from 'react'
import { X, MessageSquarePlus, CheckCircle } from 'lucide-react'
import Button from './Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const CATEGORIES = ['Bug / Something broken', 'Feature request', 'Bad experience', 'General feedback']

export default function FeedbackModal({ onClose }) {
  const { user } = useAuth()
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    setError('')
    if (!message.trim()) {
      setError('Please write your feedback before sending')
      return
    }

    setLoading(true)
    try {
      const { error: insertError } = await supabase.from('feedback').insert({
        user_id: user?.id || null,
        user_email: user?.email || null,
        message: category ? `[${category}] ${message.trim()}` : message.trim(),
      })
      if (insertError) throw insertError
      setSubmitted(true)
    } catch (err) {
      setError('Could not send feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50 flex items-end justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white w-full max-w-lg rounded-t-[28px] px-5 pt-5 pb-10 shadow-2xl">
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

        {/* Close */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <MessageSquarePlus size={18} className="text-orange" />
            <h2 className="font-display font-bold text-navy text-base">Share your feedback</h2>
          </div>
          <button onClick={onClose} className="text-muted">
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          // Success state
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <CheckCircle size={44} className="text-success mb-3" />
            <h3 className="font-display font-bold text-navy text-lg">Thank you! 🙏</h3>
            <p className="text-sm text-muted mt-2 max-w-xs leading-relaxed">
              Your feedback helps us build a better platform for every student. We read every single one.
            </p>
            <Button variant="ghost" className="mt-6" onClick={onClose}>
              Close
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted leading-relaxed">
              We're in early access and your experience matters a lot. Tell us what's working, what's broken, or what you wish existed.
            </p>

            {/* Category chips */}
            <div>
              <label className="block text-xs font-semibold text-navy mb-2 font-display">
                Category <span className="text-muted font-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat === category ? '' : cat)}
                    className={`text-xs font-semibold font-display px-3 py-1.5 rounded-chip transition-colors ${
                      category === cat
                        ? 'bg-orange text-white'
                        : 'bg-cream text-navy border border-border'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold text-navy mb-1.5 font-display">
                Your message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us anything — the good, the bad, ideas for improvement…"
                rows={5}
                autoFocus
                className="w-full bg-cream border border-border rounded-button px-4 py-3 text-sm text-navy outline-none focus:border-orange transition-colors placeholder:text-muted/60 resize-none"
              />
              <p className="text-[10px] text-muted mt-1">
                Sent as {user?.email || 'anonymous'}
              </p>
            </div>

            {error && (
              <div className="bg-danger-bg text-danger text-xs font-medium rounded-button px-4 py-3">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send Feedback'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
