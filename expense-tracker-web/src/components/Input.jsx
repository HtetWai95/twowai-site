import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({ label, error, type = 'text', prefix, className = '', ...rest }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${error ? 'error' : ''}`}>
        {prefix && <span style={{ marginRight: 6, color: 'var(--text-sec)' }}>{prefix}</span>}
        <input type={isPassword ? (show ? 'text' : 'password') : type} {...rest} />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} style={{ color: 'var(--text-sec)', display: 'flex' }}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
