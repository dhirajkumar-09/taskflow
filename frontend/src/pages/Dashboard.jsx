import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/api';
import { colorFor, initials } from '../utils/avatar';
import Avatar from '../components/Avatar';

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const start = display;
    const duration = 600;
    const startTime = performance.now();

    let frame;
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(start + (target - start) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}

function StatCard({ label, value, accent, suffix = '' }) {
  return (
    <div
      className="stat-glow rounded-2xl px-5 py-4 flex-1 min-w-[140px] transition-transform hover:-translate-y-0.5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-display text-2xl font-bold" style={{ color: accent || 'var(--text)' }}>
        <AnimatedNumber value={value} />{suffix}
      </p>
    </div>
  );
}

function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [stats, setStats] = useState(null);
  const [newBoardName, setNewBoardName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // recent | name | oldest
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [poppingId, setPoppingId] = useState(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchBoards = async () => {
    try {
      const res = await authFetch('/api/boards');
      const data = await res.json();
      setBoards(data);
    } catch (err) {
      if (err.message !== 'Session expired') setError('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await authFetch('/api/boards/stats/summary');
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch (err) {
      // Non-critical — dashboard still works without the stats row
    }
  };

  useEffect(() => { fetchBoards(); fetchStats(); }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      const res = await authFetch('/api/boards', {
        method: 'POST',
        body: JSON.stringify({ name: newBoardName })
      });
      if (!res.ok) throw new Error('Failed to create board');
      setNewBoardName('');
      fetchBoards();
      fetchStats();
    } catch (err) {
      if (err.message !== 'Session expired') setError('Failed to create board');
    }
  };

  const handleRename = async (boardId) => {
    if (!editName.trim()) return;
    try {
      await authFetch(`/api/boards/${boardId}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editName })
      });
      setEditingId(null);
      fetchBoards();
    } catch (err) {
      if (err.message !== 'Session expired') setError('Failed to rename board');
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Delete this board and all its tasks?')) return;
    try {
      await authFetch(`/api/boards/${boardId}`, { method: 'DELETE' });
      setOpenMenuId(null);
      fetchBoards();
      fetchStats();
    } catch (err) {
      if (err.message !== 'Session expired') setError('Failed to delete board');
    }
  };

  const handleToggleFavorite = async (e, boardId) => {
    e.stopPropagation();
    setPoppingId(boardId);
    setTimeout(() => setPoppingId(null), 450);
    // Optimistic update so the star responds instantly
    setBoards((prev) => prev.map((b) => b._id === boardId ? { ...b, isFavorite: !b.isFavorite } : b));
    try {
      const res = await authFetch(`/api/boards/${boardId}/favorite`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to toggle favorite');
    } catch (err) {
      // Roll back on failure
      setBoards((prev) => prev.map((b) => b._id === boardId ? { ...b, isFavorite: !b.isFavorite } : b));
      if (err.message !== 'Session expired') setError('Failed to update favorite');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const visibleBoards = useMemo(() => {
    let list = [...boards];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q));
    }

    if (favoritesOnly) {
      list = list.filter((b) => b.isFavorite);
    }

    if (sortBy === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else {
      // 'recent' — most recently updated first (API already sorts this way,
      // but we re-sort defensively in case of optimistic/local updates)
      list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    }

    // Favorites always float to the top within the current sort/filter
    list.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));

    return list;
  }, [boards, search, sortBy, favoritesOnly]);

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <div className="grid-pattern absolute inset-x-0 top-0 h-96 pointer-events-none"></div>
      <div className="glow-orb floaty absolute -top-40 left-1/4 w-[500px] h-[500px] pointer-events-none" style={{ opacity: 0.2 }}></div>

      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
      )}

      <nav
        className="sticky top-0 z-20 flex justify-between items-center px-8 py-4"
        style={{ background: 'rgba(6,8,15,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
            <span className="font-display text-white text-sm font-bold">T</span>
          </div>
          <span className="font-display text-white font-semibold text-lg">TaskFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 0 0 2px var(--bg), 0 0 0 3px var(--border)' }}>
            {initials(user.name)}
          </div>
          <button
            onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-lg transition"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="relative z-0 max-w-5xl mx-auto px-6 py-14 fade-in-up">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
          <div>
            <h2 className="gradient-text font-display text-4xl font-bold mb-2">Your boards</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {boards.length === 0 ? 'Nothing here yet — create your first board' : `${boards.length} board${boards.length > 1 ? 's' : ''} in progress`}
            </p>
          </div>
        </div>

        {stats && (
          <div className="flex flex-wrap gap-4 mb-10">
            <StatCard label="Total Boards" value={stats.totalBoards} />
            <StatCard label="Total Tasks" value={stats.totalTasks} />
            <StatCard label="Completed" value={stats.done} accent="var(--success)" />
            <StatCard label="Completion Rate" value={stats.completionRate} suffix="%" accent="var(--accent-2)" />
          </div>
        )}

        <form onSubmit={handleCreateBoard} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Name a new board..."
            className="flex-1 rounded-xl px-4 py-3 outline-none transition"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-xl font-medium text-white transition shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
          >
            + New Board
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-[200px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }}>
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boards..."
              className="w-full rounded-xl pl-10 pr-4 py-2.5 outline-none transition text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl px-3 py-2.5 outline-none transition text-sm shrink-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="recent">Recently updated</option>
            <option value="name">Name A–Z</option>
            <option value="oldest">Oldest first</option>
          </select>

          <button
            type="button"
            onClick={() => setFavoritesOnly((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition shrink-0"
            style={{
              background: favoritesOnly ? 'rgba(245,158,11,0.15)' : 'var(--surface)',
              border: `1px solid ${favoritesOnly ? '#f59e0b' : 'var(--border)'}`,
              color: favoritesOnly ? '#f59e0b' : 'var(--text)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={favoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            Favorites
          </button>
        </div>

        {error && <p style={{ color: 'var(--danger)' }} className="mb-4">{error}</p>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton-shimmer card-in h-36 rounded-2xl"
                style={{ animationDelay: `${i * 80}ms` }}
              ></div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
            <p className="text-xl font-medium text-white mb-2">No boards yet</p>
            <p style={{ color: 'var(--text-muted)' }}>Create one above to start organizing your work</p>
          </div>
        ) : visibleBoards.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
            <p className="text-xl font-medium text-white mb-2">No matching boards</p>
            <p style={{ color: 'var(--text-muted)' }}>Try a different search or clear the Favorites filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {visibleBoards.map((board, index) => {
              const [c1, c2] = colorFor(board.name);
              const isEditing = editingId === board._id;
              const taskCount = board.taskCount || 0;
              const doneCount = board.doneCount || 0;
              const progress = taskCount === 0 ? 0 : Math.round((doneCount / taskCount) * 100);
              return (
                <div
                  key={board._id}
                  className="group card-in rounded-2xl p-6 transition-all duration-300 relative"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: `${Math.min(index, 8) * 60}ms` }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = c1; e.currentTarget.style.boxShadow = `0 12px 34px ${c1}22`; e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl" style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }}></div>

                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => !isEditing && navigate(`/board/${board._id}`)}
                      className="flex-1 cursor-pointer min-w-0"
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.key === 'Enter' && handleRename(board._id)}
                          onBlur={() => handleRename(board._id)}
                          className="w-full rounded-lg px-2 py-1 text-white outline-none mb-1.5 font-display font-semibold text-lg"
                          style={{ background: 'var(--bg)', border: '1px solid var(--accent)' }}
                        />
                      ) : (
                        <h3 className="font-display font-semibold text-lg text-white mb-1.5 truncate">{board.name}</h3>
                      )}
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Created {new Date(board.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={(e) => handleToggleFavorite(e, board._id)}
                      className={`p-1.5 rounded-lg transition shrink-0 ${poppingId === board._id ? 'pop-animate' : ''}`}
                      title={board.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      style={{ color: board.isFavorite ? '#f59e0b' : 'var(--text-muted)' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill={board.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>

                    <div className="relative z-20">
                      <button
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === board._id ? null : board._id); }}
                        className="p-1.5 rounded-lg transition"
                        style={{ color: 'var(--text-muted)', background: openMenuId === board._id ? 'var(--surface-2)' : 'transparent' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>
                        </svg>
                      </button>

                      {openMenuId === board._id && (
                        <div
                          className="absolute right-0 top-full mt-2 rounded-xl overflow-hidden w-36 shadow-2xl"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingId(board._id); setEditName(board.name); setOpenMenuId(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition"
                            style={{ color: 'var(--text)' }}
                          >
                            Rename
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteBoard(board._id); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-white/5 transition"
                            style={{ color: 'var(--danger)' }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div
                        className="progress-fill h-full rounded-full"
                        style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                      ></div>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: 'var(--text-muted)' }}>
                      {doneCount}/{taskCount} tasks
                    </span>
                  </div>

                  {board.members && board.members.length > 0 && (
                    <div className="flex items-center -space-x-2 mt-3">
                      {board.members.slice(0, 4).map((m) => (
                        <Avatar key={m._id} name={m.name} size={24} ring title={m.name} />
                      ))}
                      {board.members.length > 4 && (
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold"
                          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', boxShadow: '0 0 0 2px var(--bg), 0 0 0 3px var(--border)' }}
                        >
                          +{board.members.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;