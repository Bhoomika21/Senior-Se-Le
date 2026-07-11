export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-semibold text-navy mb-1.5 font-display">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-white border ${
          error ? 'border-danger' : 'border-border'
        } rounded-button px-4 py-3 text-sm text-navy outline-none focus:border-orange transition-colors placeholder:text-muted/60 ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}
