import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      const res = await fetch('http://localhost:5000/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBoardName })
      });

      if (!res.ok) throw new Error('Failed to create board');

      setNewBoardName('');
      fetchBoards(); // refresh the list
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
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <h1 className="text-xl font-bold">TaskFlow</h1>
        <div className="flex items-center gap-4">
          <span className="text-slate-400 text-sm">Hi, {user.name}</span>
          <button
            onClick={handleLogout}
            className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">Your Boards</h2>

        <form onSubmit={handleCreateBoard} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            placeholder="New board name..."
            className="flex-1 bg-slate-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg font-medium"
          >
            + New Board
          </button>
        </form>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {loading ? (
          <p className="text-slate-400">Loading boards...</p>
        ) : boards.length === 0 ? (
          <p className="text-slate-400">No boards yet. Create your first one above!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board._id}
                className="bg-slate-800 hover:bg-slate-700 rounded-xl p-5 cursor-pointer transition"
              >
                <h3 className="font-semibold text-lg">{board.name}</h3>
                <p className="text-slate-400 text-sm mt-1">
                  Created {new Date(board.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;