import { useState } from 'react'
import { ChevronLeft, ShieldOff } from 'lucide-react'
import Button from '../components/Button'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function BlockUser({ blockedUserId, blockedUserName, onBack, onBlocked }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleBlock() {
    setLoading(true)
    setError('')
    const { error } = await supabase.from('blocks').insert({
      blocker_id: user.id,
      blocked_id: blockedUserId,
    })
    setLoading(false)
    if (error) {
      setError('Could not block this user. Try again.')
    } else {
      onBlocked?.()
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="bg-navy px-4 pt-5 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-white">
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-display font-bold text-white text-base">Block User</h1>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-full bg-danger-bg flex items-center justify-center mb-4">
          <ShieldOff size={26} className="text-danger" />
        </div>
        <h2 className="font-display font-bold text-lg text-navy mb-2">
          Block {blockedUserName || 'this user'}?
        </h2>
        <p className="text-sm text-muted leading-relaxed max-w-xs">
          They won't be able to message you, and their listings will be hidden from your feed. This
          doesn't notify them, and you can unblock anytime from your profile settings.
        </p>

        {error && (
          <div className="bg-danger-bg text-danger text-xs font-medium rounded-button px-4 py-3 mt-4 w-full">
            {error}
          </div>
        )}

        <div className="flex gap-3 w-full mt-8">
          <Button variant="subtle" size="lg" className="flex-1" onClick={onBack}>
            Cancel
          </Button>
          <Button variant="danger" size="lg" className="flex-1" onClick={handleBlock} disabled={loading}>
            {loading ? 'Blocking…' : 'Block'}
          </Button>
        </div>
      </div>
    </div>
  )
}
