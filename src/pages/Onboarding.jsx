import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import Button from '../components/Button'

const SLIDES = [
  {
    emoji: '📚',
    title: 'Books from your seniors',
    subtitle: 'Get textbooks at half the price — directly from students who already passed that semester.',
    bg: 'from-navy to-navy-light',
  },
  {
    emoji: '💬',
    title: 'Chat safely, meet locally',
    subtitle: 'No phone numbers shared. Chat inside the app, meet on campus, inspect the book before paying.',
    bg: 'from-[#1a2a4a] to-navy',
  },
  {
    emoji: '⭐',
    title: 'Trust built on ratings',
    subtitle: 'Every buyer and seller gets rated. Verified condition videos mean no surprises when you meet.',
    bg: 'from-navy to-[#2a1a3a]',
  },
  {
    emoji: '🚀',
    title: "Let's get started",
    subtitle: 'Join your college\'s book resale community. Buy smart. Sell easy.',
    bg: 'from-navy to-navy-light',
    isLast: true,
  },
]

export default function Onboarding({ onDone }) {
  const [current, setCurrent] = useState(0)
  const slide = SLIDES[current]

  function next() {
    if (current < SLIDES.length - 1) {
      setCurrent(current + 1)
    } else {
      onDone()
    }
  }

  function skip() {
    onDone()
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${slide.bg} flex flex-col transition-all duration-500`}>
      {/* Skip */}
      {!slide.isLast && (
        <div className="flex justify-end px-6 pt-6">
          <button onClick={skip} className="text-white/50 text-sm font-medium">
            Skip
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
        <div className="text-8xl mb-2 animate-bounce">{slide.emoji}</div>
        <div>
          <h1 className="font-display font-bold text-white text-3xl leading-tight mb-3">
            {slide.title}
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-xs">
            {slide.subtitle}
          </p>
        </div>
      </div>

      {/* Dots + Button */}
      <div className="px-8 pb-12 flex flex-col items-center gap-6">
        {/* Progress dots */}
        <div className="flex gap-2">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 h-2 bg-orange'
                  : 'w-2 h-2 bg-white/30'
              }`}
            />
          ))}
        </div>

        {slide.isLast ? (
          <div className="w-full flex flex-col gap-3">
            <Button variant="primary" size="lg" className="w-full" onClick={onDone}>
              Create Account
            </Button>
            <Button variant="ghost" size="lg" className="w-full border-white/30 text-white" onClick={onDone}>
              Log In
            </Button>
          </div>
        ) : (
          <button
            onClick={next}
            className="w-14 h-14 rounded-full bg-orange flex items-center justify-center shadow-lg shadow-orange/30 active:scale-90 transition-transform"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        )}
      </div>
    </div>
  )
}
