import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ACCENT_PAIRS = [
  ['#6366f1', '#a855f7'],
  ['#10b981', '#06b6d4'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
  ['#0ea5e9', '#22d3ee']
];

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_PAIRS[Math.abs(hash) % ACCENT_PAIRS.length];
}

function initials(name) {
  return name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';
}

function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchBoards = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/boards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setBoards(data);
    } catch (err) {
      setError('Failed to load boards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBoards(); }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;
    try {
      const res = await fetch('http://localhost:5000/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newBoardName })
      });
      if (!res.ok) throw new Error('Failed to create board');
      setNewBoardName('');
      fetchBoards();
    } catch (err) {
      setError('Failed to create board');
    }
  };

  const handleRename = async (boardId) => {
    if (!editName.trim()) return;
    try {
      await fetch(`http://localhost:5000/api/boards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName })
      });
      setEditingId(null);
      fetchBoards();
    } catch (err) {
      setError('Failed to rename board');
    }
  };

  const handleDeleteBoard = async (boardId) => {
    if (!window.confirm('Delete this board and all its tasks?')) return;
    try {
      await fetch(`http://localhost:5000/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setOpenMenuId(null);
      fetchBoards();
    } catch (err) {
      setError('Failed to delete board');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <div className="grid-pattern absolute inset-x-0 top-0 h-96 pointer-events-none"></div>
      <div className="glow-orb floaty absolute -top-40 left-1/4 w-[500px] h-[500px] pointer-events-none" style={{ opacity: 0.2 }}></div>

      {/* Click-outside overlay to close menu */}
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
        <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
          <div>
            <h2 className="font-display text-4xl font-bold text-white mb-2">Your boards</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              {boards.length === 0 ? 'Nothing here yet — create your first board' : `${boards.length} board${boards.length > 1 ? 's' : ''} in progress`}
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateBoard} className="flex gap-3 mb-10">
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

        {error && <p style={{ color: 'var(--danger)' }} className="mb-4">{error}</p>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }}></div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20 rounded-2xl" style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
            <p className="text-xl font-medium text-white mb-2">No boards yet</p>
            <p style={{ color: 'var(--text-muted)' }}>Create one above to start organizing your work</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {boards.map((board) => {
              const [c1, c2] = colorFor(board.name);
              const isEditing = editingId === board._id;
              return (
                <div
                  key={board._id}
                  className="group rounded-2xl p-6 transition relative"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = c1; e.currentTarget.style.boxShadow = `0 8px 30px ${c1}22`; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
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