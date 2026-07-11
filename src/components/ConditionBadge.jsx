const CONDITIONS = {
  5: { label: 'Like New', bg: 'bg-success-bg', text: 'text-success' },
  4: { label: 'Good', bg: 'bg-warning-bg', text: 'text-warning' },
  3: { label: 'Fair', bg: 'bg-orange/10', text: 'text-orange' },
  2: { label: 'Worn', bg: 'bg-danger-bg', text: 'text-danger' },
  1: { label: 'Heavily Used', bg: 'bg-navy/5', text: 'text-muted' },
}

export default function ConditionBadge({ level, size = 'sm' }) {
  const c = CONDITIONS[level] || CONDITIONS[3]
  const sizeClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-3 py-1'

  return (
    <span
      className={`inline-block font-semibold rounded-chip ${c.bg} ${c.text} ${sizeClass}`}
    >
      {c.label}
    </span>
  )
}

export { CONDITIONS }
