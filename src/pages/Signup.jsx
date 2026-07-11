import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'

export default function Signup({ onSwitchToLogin }) {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [college, setCollege] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const { error } = await signUp({ email, password, fullName, college })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center text-3xl mb-4">
          ✓
        </div>
        <h2 className="font-display font-bold text-xl text-navy mb-2">Check your email</h2>
        <p className="text-sm text-muted max-w-xs">
          We've sent a confirmation link to <span className="font-semibold text-navy">{email}</span>.
          Verify your email to start using Senior Se Le.
        </p>
        <Button variant="ghost" className="mt-6" onClick={onSwitchToLogin}>
          Back to Login
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col px-6 pt-12 pb-8">
      <div className="flex justify-center mb-8">
        <Logo size="md" showTagline />
      </div>

      <h1 className="font-display font-bold text-2xl text-navy text-center mb-1">
        Create your account
      </h1>
      <p className="text-sm text-muted text-center mb-8">
        Join your college's book resale community
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          type="text"
          placeholder="Riya Sharma"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

        <Input
          label="College Name"
          type="text"
          placeholder="e.g. VJTI Mumbai"
          value={college}
          onChange={(e) => setCollege(e.target.value)}
          required
        />

        <Input
          label="College Email"
          type="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-4 top-[34px] text-muted"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {error && (
          <div className="bg-danger-bg text-danger text-xs font-medium rounded-button px-4 py-3">
            {error}
          </div>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={loading}>
          {loading ? 'Creating account…' : 'Sign Up'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-8">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-orange font-semibold">
          Log in
        </button>
      </p>
    </div>
  )
}
