export default function Button({
  children, onClick, variant = 'primary', size = '',
  disabled, loading, className = '', type = 'button', full,
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${size ? `btn-${size}` : ''} ${full ? 'btn-full' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading ? <span className="spinner spinner-sm" /> : children}
    </button>
  );
}
