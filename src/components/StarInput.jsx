import { Star } from 'lucide-react'
import { useState } from 'react'

export default function StarInput({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="flex gap-1.5 justify-center">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hover || value)
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform active:scale-90"
          >
            <Star
              size={size}
              className={filled ? 'text-warning fill-warning' : 'text-border fill-border'}
            />
          </button>
        )
      })}
    </div>
  )
}
