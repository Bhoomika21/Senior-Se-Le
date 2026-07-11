export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className = '',
  ...props
}) {
  const base =
    'font-display font-semibold inline-flex items-center justify-center gap-2 rounded-button transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none'

  const variants = {
    primary: 'bg-orange text-white shadow-lg shadow-orange/25 hover:bg-orange-dark',
    secondary: 'bg-navy text-white hover:bg-navy-light',
    ghost: 'bg-transparent text-orange border-2 border-orange hover:bg-orange/5',
    success: 'bg-success text-white hover:opacity-90',
    danger: 'bg-danger text-white hover:opacity-90',
    subtle: 'bg-navy/5 text-navy hover:bg-navy/10',
  }

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  }

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {Icon && <Icon size={size === 'sm' ? 14 : 18} strokeWidth={2.5} />}
      {children}
    </button>
  )
}
