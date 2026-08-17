import { useState } from 'react'
import { Eye, EyeOff, MapPin, Loader, CheckCircle } from 'lucide-react'
import Logo from '../components/Logo'
import Input from '../components/Input'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { pinToLatLng } from '../lib/pincode'

export default function Signup({ onSwitchToLogin }) {
  const { signUp } = useAuth()
  const [fullName, setFullName] = useState('')
  const [college, setCollege] = useState('')
  const [city, setCity] = useState('')
  const [pinCode, setPinCode] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinResolved, setPinResolved] = useState(null)
  const [pinError, setPinError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handlePinChange(val) {
    const cleaned = val.replace(/\D/g, '').slice(0, 6)
    setPinCode(cleaned)
    setPinError('')
    setPinResolved(null)
    if (cleaned.length === 6) {
      setPinLoading(true)
      const result = await pinToLatLng(cleaned)
      setPinLoading(false)
      if (result) setPinResolved(result)
      else setPinError('Could not find this PIN code. Please check and try again.')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!city.trim()) { setError('Please enter your city name'); return }
    if (pinCode.length > 0 && pinCode.length < 6) { setError('PIN code must be 6 digits'); return }
    setLoading(true)
    const { error } = await signUp({
      email, password, fullName, college,
      city: city.trim(),
      lat: pinResolved?.lat || null,
      lng: pinResolved?.lng || null,
    })
    setLoading(false)
    if (error) setError(error.message); else setSuccess(true)
  }

  if (success) return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-success-bg flex items-center justify-center text-3xl mb-4">✓</div>
      <h2 className="font-display font-bold text-xl text-navy mb-2">You're in!</h2>
      <p className="text-sm text-muted max-w-xs">Account created successfully. You can now log in.</p>
      <Button variant="primary" className="mt-6" onClick={onSwitchToLogin}>Go to Login</Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream flex flex-col px-6 pt-10 pb-10 overflow-y-auto">
      <div className="flex justify-center mb-6"><Logo size="md" /></div>
      <h1 className="font-display font-bold text-2xl text-navy text-center mb-1">Create your account</h1>
      <p className="text-sm text-muted text-center mb-6">Join your college's book resale community</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Full Name" type="text" placeholder="Riya Sharma" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input label="College Name" type="text" placeholder="e.g. VJTI Mumbai" value={college} onChange={(e) => setCollege(e.target.value)} required />
        <div className="bg-white rounded-card border border-border p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-orange shrink-0" />
            <p className="font-display font-semibold text-sm text-navy">Your Location</p>
          </div>
          <p className="text-[11px] text-muted leading-relaxed -mt-1">Helps buyers find books near them and lets you filter listings by distance.</p>
          <Input label="City / Area" type="text" placeholder="e.g. Mumbai, Pune, Delhi" value={city} onChange={(e) => setCity(e.target.value)} required />
          <div>
            <label className="block text-xs font-semibold text-navy mb-1.5 font-display">PIN Code <span className="text-muted font-normal">(optional — enables distance filtering)</span></label>
            <div className="relative">
              <input type="text" inputMode="numeric" placeholder="e.g. 400019" value={pinCode} onChange={(e) => handlePinChange(e.target.value)} maxLength={6}
                className={`w-full bg-white border rounded-button px-4 py-3 text-sm text-navy outline-none transition-colors placeholder:text-muted/60 pr-10 ${pinError ? 'border-danger' : pinResolved ? 'border-success' : 'border-border focus:border-orange'}`} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {pinLoading && <Loader size={16} className="text-muted animate-spin" />}
                {!pinLoading && pinResolved && <CheckCircle size={16} className="text-success" />}
              </div>
            </div>
            {pinError && <p className="text-xs text-danger mt-1">{pinError}</p>}
            {pinResolved && <p className="text-[11px] text-success mt-1">✓ Location found: {pinResolved.display}</p>}
          </div>
        </div>
        <Input label="College Email" type="email" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <div className="relative">
          <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-4 top-[34px] text-muted">
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {error && <div className="bg-danger-bg text-danger text-xs font-medium rounded-button px-4 py-3">{error}</div>}
        <Button type="submit" variant="primary" size="lg" className="w-full mt-2" disabled={loading}>{loading ? 'Creating account…' : 'Sign Up'}</Button>
      </form>
      <p className="text-center text-sm text-muted mt-6">Already have an account? <button onClick={onSwitchToLogin} className="text-orange font-semibold">Log in</button></p>
    </div>
  )
}
