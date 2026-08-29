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
  return name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
}

function Dashboard() {
  const [boards, setBoards] = useState([]);
  const [newBoardName, setNewBoardName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="grid-pattern absolute inset-x-0 top-0 h-72 pointer-events-none"></div>
      <div className="glow-orb absolute -top-32 left-1/3 w-96 h-96 pointer-events-none" style={{ opacity: 0.25 }}></div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
            <span className="font-display text-white text-sm font-bold">T</span>
          </div>
          <span className="font-display text-white font-semibold">TaskFlow</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 fade-in-up">
        <h2 className="font-display text-3xl font-bold text-white mb-1">Your boards</h2>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
          {boards.length === 0 ? 'Nothing here yet — create your first board' : `${boards.length} board${boards.length > 1 ? 's' : ''} in progress`}
        </p>

        <form onSubmit={handleCreateBoard} className="flex gap-3 mb-10">
          <input
            type="text"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="Name a new board..."
            className="flex-1 rounded-lg px-4 py-2.5 outline-none transition"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg font-medium text-white transition shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
          >
            + New Board
          </button>
        </form>

        {error && <p style={{ color: 'var(--danger)' }} className="mb-4">{error}</p>}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }}></div>
            ))}
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
            <p className="text-lg font-medium text-white mb-1">No boards yet</p>
            <p style={{ color: 'var(--text-muted)' }}>Create one above to start organizing your work</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {boards.map((board) => {
              const [c1, c2] = colorFor(board.name);
              return (
                <div
                  key={board._id}
                  onClick={() => navigate(`/board/${board._id}`)}
                  className="group rounded-xl p-5 cursor-pointer transition relative overflow-hidden"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = c1; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }}></div>
                  <h3 className="font-display font-semibold text-lg text-white mb-1">{board.name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Created {new Date(board.createdAt).toLocaleDateString()}
                  </p>
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