import { colorFor, initials } from '../utils/avatar';

function Avatar({ name, size = 32, ring = false, title }) {
  const [c1, c2] = colorFor(name || '');
  return (
    <div
      title={title || name || 'Unassigned'}
      className="rounded-full flex items-center justify-center shrink-0 font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.36),
        background: name ? `linear-gradient(135deg, ${c1}, ${c2})` : 'var(--surface-2)',
        color: name ? '#fff' : 'var(--text-muted)',
        border: name ? 'none' : '1.5px dashed var(--border)',
        boxShadow: ring ? '0 0 0 2px var(--bg), 0 0 0 3.5px var(--border)' : 'none'
      }}
    >
      {name ? initials(name) : '?'}
    </div>
  );
}

export default Avatar;
