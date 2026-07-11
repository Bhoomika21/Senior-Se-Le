import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'

export default function Login({ onSwitchToSignup }) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn({ email, password })
    setLoading(false)
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col px-6 pt-16 pb-8">
      <div className="flex justify-center mb-10">
        <Logo size="md" showTagline />
      </div>

      <h1 className="font-display font-bold text-2xl text-navy text-center mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-muted text-center mb-8">
        Log in to buy and sell books with your seniors
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            placeholder="••••••••"
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
          {loading ? 'Logging in…' : 'Log In'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted mt-8">
        New here?{' '}
        <button onClick={onSwitchToSignup} className="text-orange font-semibold">
          Create an account
        </button>
      </p>
    </div>
  )
}
