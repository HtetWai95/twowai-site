import { formatInitials, generateAvatarColor } from '../utils/formatters';

export default function Avatar({ name = '', id, size = 36 }) {
  const bg = generateAvatarColor(id || name);
  const fs = Math.round(size * 0.38);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0, fontWeight: 700, fontSize: fs, color: '#fff',
      userSelect: 'none',
    }}>
      {formatInitials(name)}
    </div>
  );
}
