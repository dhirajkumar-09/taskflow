import Avatar from './Avatar';
import { colorFor } from '../utils/avatar';

function TeamPanel({ people, tasks, onInvite, isOwner, currentUserId, onRemove }) {
  const stats = people.map((person) => {
    const assigned = tasks.filter((t) => t.assignee && t.assignee._id === person._id);
    const done = assigned.filter((t) => t.status === 'done').length;
    const inProgress = assigned.filter((t) => t.status === 'in-progress').length;
    const todo = assigned.filter((t) => t.status === 'todo').length;
    const pct = assigned.length ? Math.round((done / assigned.length) * 100) : 0;
    return { person, total: assigned.length, done, inProgress, todo, pct };
  });

  const unassignedCount = tasks.filter((t) => !t.assignee).length;

  return (
    <div
      className="rounded-2xl p-5 mb-8"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M17 20v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 10a4 4 0 100-8 4 4 0 000 8zM23 20v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="var(--accent-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3 className="font-display font-semibold text-white text-base">Team workload</h3>
        </div>
        {isOwner && (
          <button
            onClick={onInvite}
            className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition flex items-center gap-1.5"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            Invite member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stats.map(({ person, total, done, inProgress, todo, pct }) => {
          const [c1, c2] = colorFor(person.name);
          return (
            <div
              key={person._id}
              className="rounded-xl p-3.5 relative group"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <Avatar name={person.name} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                    {person.name}
                    {person.isOwner && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold shrink-0" style={{ background: 'rgba(168,85,247,0.15)', color: 'var(--accent-2)' }}>
                        OWNER
                      </span>
                    )}
                  </p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{person.email}</p>
                </div>
                {isOwner && !person.isOwner && (
                  <button
                    onClick={() => onRemove(person._id)}
                    className="opacity-0 group-hover:opacity-100 transition p-1 rounded shrink-0"
                    style={{ color: 'var(--danger)' }}
                    title="Remove from board"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between text-xs mb-1.5">
                <span style={{ color: 'var(--text-muted)' }}>
                  {total === 0 ? 'No tasks assigned' : `${total} task${total > 1 ? 's' : ''} assigned`}
                </span>
                {total > 0 && <span className="font-semibold" style={{ color: c1 }}>{pct}% done</span>}
              </div>

              <div className="h-1.5 rounded-full overflow-hidden mb-2.5" style={{ background: 'var(--bg)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                ></div>
              </div>

              <div className="flex items-center gap-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b93a7' }}></span>{todo} to do</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1' }}></span>{inProgress} active</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981' }}></span>{done} done</span>
              </div>
            </div>
          );
        })}

        {unassignedCount > 0 && (
          <div
            className="rounded-xl p-3.5 flex flex-col items-center justify-center text-center"
            style={{ background: 'var(--surface-2)', border: '1px dashed var(--border)' }}
          >
            <Avatar name="" size={34} />
            <p className="text-sm font-medium text-white mt-2">Unassigned</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{unassignedCount} task{unassignedCount > 1 ? 's' : ''} up for grabs</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TeamPanel;
