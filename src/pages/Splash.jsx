import { SplashLogo } from '../components/Logo'

export default function Splash() {
  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient glow accents */}
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-orange/20 blur-3xl" />
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-orange/10 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* App icon version — big and centered */}
        <SplashLogo />

        {/* Tagline */}
        <p className="text-white/50 text-xs tracking-widest uppercase font-display">
          Buy Smart. Sell Easy.
        </p>

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-4">
          <span className="w-2 h-2 rounded-full bg-orange animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-orange/70 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-orange/40 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
