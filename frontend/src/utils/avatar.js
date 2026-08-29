export const ACCENT_PAIRS = [
  ['#6366f1', '#a855f7'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
  ['#0ea5e9', '#22d3ee'],
  ['#84cc16', '#22c55e'],
  ['#f472b6', '#fb7185']
];

export function colorFor(seed) {
  const str = seed || '?';
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_PAIRS[Math.abs(hash) % ACCENT_PAIRS.length];
}

export function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}
