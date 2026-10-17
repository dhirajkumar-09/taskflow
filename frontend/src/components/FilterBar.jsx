import { useMemo } from 'react';

const PRIORITY_COLOR = { low: '#8b93a7', medium: '#f59e0b', high: '#f87171' };

const PRESET_LABELS = [
  { key: 'bug', color: '#f87171' },
  { key: 'feature', color: '#6366f1' },
  { key: 'urgent', color: '#f59e0b' },
  { key: 'review', color: '#10b981' },
  { key: 'blocked', color: '#ec4899' },
];

export default function FilterBar({ filters, setFilters, members, allLabels }) {
  const allTagLabels = useMemo(() => {
    const set = new Set([...PRESET_LABELS.map((p) => p.key), ...(allLabels || [])]);
    return Array.from(set);
  }, [allLabels]);

  const toggleLabel = (label) => {
    setFilters((f) => {
      const has = (f.labels || []).includes(label);
      return { ...f, labels: has ? f.labels.filter((l) => l !== label) : [...(f.labels || []), label] };
    });
  };

  const hasFilters = filters.search || filters.priority || filters.assignee || (filters.labels || []).length > 0;

  return (
    <div
      className="rounded-2xl p-4 mb-6"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}>
            <circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>

        {/* Priority */}
        <select
          value={filters.priority || ''}
          onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}
          className="rounded-xl px-3 py-2 text-sm outline-none transition"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="">All priorities</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">⚪ Low</option>
        </select>

        {/* Assignee */}
        <select
          value={filters.assignee || ''}
          onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value }))}
          className="rounded-xl px-3 py-2 text-sm outline-none transition"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="">All members</option>
          <option value="__unassigned__">Unassigned</option>
          {(members || []).map((m) => (
            <option key={m._id} value={m._id}>{m.name}</option>
          ))}
        </select>

        {/* Clear button */}
        {hasFilters && (
          <button
            onClick={() => setFilters({ search: '', priority: '', assignee: '', labels: [] })}
            className="text-xs px-3 py-2 rounded-xl transition"
            style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--danger)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Label pills */}
      {allTagLabels.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Labels:</span>
          {allTagLabels.map((label) => {
            const preset = PRESET_LABELS.find((p) => p.key === label);
            const color = preset ? preset.color : '#8b93a7';
            const active = (filters.labels || []).includes(label);
            return (
              <button
                key={label}
                onClick={() => toggleLabel(label)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full transition"
                style={{
                  background: active ? `${color}22` : 'var(--bg)',
                  border: `1px solid ${active ? color : 'var(--border)'}`,
                  color: active ? color : 'var(--text-muted)'
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
