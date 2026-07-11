import { useState } from 'react'
import { ChevronLeft, Camera, X, AlertTriangle } from 'lucide-react'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const REASONS = [
  'Inappropriate or flirtatious messages',
  'Book condition was misrepresented',
  'Seller did not deliver after payment',
  'Buyer refused to pay after agreeing',
  'Abusive or threatening behavior',
  'Suspected scam or fake listing',
  'Other',
]

export default function ReportUser({ reportedUserId, reportedUserName, onBack, onSubmitted }) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [proof, setProof] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleProofPick(e) {
    const file = e.target.files[0]
    if (!file) return
    setProof({ file, preview: URL.createObjectURL(file) })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!reason) {
      setError('Please select a reason for reporting')
      return
    }

    setLoading(true)
    try {
      let proofUrl = null
      if (proof) {
        const fileExt = proof.file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}-proof.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('report-proofs')
          .upload(fileName, proof.file)
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('report-proofs').getPublicUrl(fileName)
        proofUrl = urlData.publicUrl
      }

      const fullReason = details ? `${reason}: ${details}` : reason

      const { error: insertError } = await supabase.from('reports').insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId,
        reason: fullReason,
        proof_url: proofUrl,
      })

      if (insertError) throw insertError

      onSubmitted?.()
    } catch (err) {
      setError(err.message || 'Could not submit report. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream pb-28">
      <div className="bg-navy px-4 pt-5 pb-4 flex items-center gap-3 sticky top-0 z-20">
        <button onClick={onBack} className="text-white">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display font-bold text-white text-base">Report User</h1>
      </div>

      <div className="px-4 pt-5 flex flex-col gap-5">
        <div className="bg-danger-bg rounded-card p-4 flex items-start gap-2.5">
          <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
          <p className="text-xs text-navy leading-relaxed">
            Reporting <span className="font-semibold">{reportedUserName || 'this user'}</span>. False
            reports may result in action against your own account. Our team reviews every report manually.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-2 font-display">
            Reason for reporting
          </label>
          <div className="flex flex-col gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`text-left text-sm font-medium px-4 py-3 rounded-button border transition-colors ${
                  reason === r
                    ? 'bg-orange/10 border-orange text-navy'
                    : 'bg-white border-border text-navy'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-1.5 font-display">
            Additional details <span className="text-muted font-normal">(optional)</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe what happened…"
            rows={4}
            className="w-full bg-white border border-border rounded-button px-4 py-3 text-sm text-navy outline-none focus:border-orange transition-colors placeholder:text-muted/60 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-navy mb-2 font-display">
            Proof / Screenshot <span className="text-muted font-normal">(optional but recommended)</span>
          </label>
          {!proof ? (
            <label className="flex flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border py-8 cursor-pointer bg-white">
              <Camera size={20} className="text-muted" />
              <span className="text-xs font-semibold text-navy font-display">Upload screenshot</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleProofPick} />
            </label>
          ) : (
            <div className="relative rounded-card overflow-hidden border border-border">
              <img src={proof.preview} alt="" className="w-full max-h-48 object-contain bg-navy/5" />
              <button
                type="button"
                onClick={() => setProof(null)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-navy/80 flex items-center justify-center"
              >
                <X size={14} className="text-white" />
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-danger-bg text-danger text-xs font-medium rounded-button px-4 py-3">
            {error}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-cream/95 backdrop-blur border-t border-border px-4 py-4">
        <Button variant="danger" size="lg" className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Report'}
        </Button>
      </div>
    </div>
  )
}
