import { useMemo } from 'react';
import Avatar from './Avatar';

export default function BoardAnalyticsModal({ board, tasks, members, onClose }) {
  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;

    const high = tasks.filter((t) => t.priority === 'high').length;
    const medium = tasks.filter((t) => t.priority === 'medium').length;
    const low = tasks.filter((t) => t.priority === 'low').length;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const overdue = tasks.filter((t) => {
      if (t.status === 'done' || !t.dueDate) return false;
      const d = new Date(t.dueDate);
      d.setHours(0, 0, 0, 0);
      return d < now;
    }).length;

    // Member workload breakdown
    const memberStats = members.map((m) => {
      const mTasks = tasks.filter((t) => t.assignee && t.assignee._id === m._id);
      const mDone = mTasks.filter((t) => t.status === 'done').length;
      const mOverdue = mTasks.filter((t) => {
        if (t.status === 'done' || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        d.setHours(0, 0, 0, 0);
        return d < now;
      }).length;
      return {
        id: m._id,
        name: m.name,
        email: m.email,
        total: mTasks.length,
        done: mDone,
        overdue: mOverdue,
        rate: mTasks.length > 0 ? Math.round((mDone / mTasks.length) * 100) : 0
      };
    });

    const unassignedTasks = tasks.filter((t) => !t.assignee);
    const unassignedDone = unassignedTasks.filter((t) => t.status === 'done').length;

    return { total, done, inProgress, todo, rate, high, medium, low, overdue, memberStats, unassignedCount: unassignedTasks.length, unassignedDone };
  }, [tasks, members]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,8,15,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-6 md:p-8 scale-in max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">📊</span>
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Board Analytics</h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Real-time progress, workload balancing &amp; member performance for {board?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition hover:opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Top 4 Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="rounded-xl p-3.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span className="text-[11px] block mb-1" style={{ color: 'var(--text-muted)' }}>Completion Rate</span>
            <span className="font-display text-2xl font-bold" style={{ color: 'var(--success)' }}>{stats.rate}%</span>
            <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--bg)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${stats.rate}%`, background: 'var(--success)' }} />
            </div>
          </div>
          <div className="rounded-xl p-3.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span className="text-[11px] block mb-1" style={{ color: 'var(--text-muted)' }}>Total Tasks</span>
            <span className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>{stats.total}</span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text-muted)' }}>{stats.done} completed</span>
          </div>
          <div className="rounded-xl p-3.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span className="text-[11px] block mb-1" style={{ color: 'var(--text-muted)' }}>In Progress</span>
            <span className="font-display text-2xl font-bold" style={{ color: '#f59e0b' }}>{stats.inProgress}</span>
            <span className="text-[10px] block mt-1" style={{ color: 'var(--text-muted)' }}>Active right now</span>
          </div>
          <div className="rounded-xl p-3.5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span className="text-[11px] block mb-1" style={{ color: 'var(--text-muted)' }}>Overdue Tasks</span>
            <span className="font-display text-2xl font-bold" style={{ color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {stats.overdue}
            </span>
            <span className="text-[10px] block mt-1" style={{ color: stats.overdue > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
              {stats.overdue > 0 ? 'Needs attention' : 'All on time!'}
            </span>
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Priority Distribution
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
              <span className="text-xs font-bold text-red-400 block mb-0.5">🔥 High</span>
              <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>{stats.high}</span>
            </div>
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <span className="text-xs font-bold text-amber-400 block mb-0.5">⚡ Medium</span>
              <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>{stats.medium}</span>
            </div>
            <div className="rounded-lg p-2.5" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <span className="text-xs font-bold text-indigo-400 block mb-0.5">🌱 Low</span>
              <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>{stats.low}</span>
            </div>
          </div>
        </div>

        {/* Member Performance Table */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
            Team Workload &amp; Performance
          </h3>
          <div className="space-y-3">
            {stats.memberStats.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <Avatar name={m.name} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold truncate" style={{ color: 'var(--text)' }}>{m.name}</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {m.done}/{m.total} completed ({m.rate}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${m.rate}%`,
                        background: m.rate === 100 ? 'var(--success)' : 'linear-gradient(90deg, var(--accent), var(--accent-2))'
                      }}
                    />
                  </div>
                </div>
                {m.overdue > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(248,113,113,0.15)', color: 'var(--danger)' }}>
                    {m.overdue} overdue
                  </span>
                )}
              </div>
            ))}

            {stats.unassignedCount > 0 && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  ?
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Unassigned Pool</span>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {stats.unassignedDone}/{stats.unassignedCount} completed
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((stats.unassignedDone / stats.unassignedCount) * 100)}%`,
                        background: '#8b93a7'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
