import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
];

function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  const fetchTasks = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [id]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTaskTitle, boardId: id })
      });

      setNewTaskTitle('');
      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      fetchTasks();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <nav className="flex justify-between items-center px-8 py-4 border-b border-slate-800">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-slate-400 hover:text-white text-sm"
        >
          ← Back to Boards
        </button>
        <h1 className="text-lg font-bold">TaskFlow</h1>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleAddTask} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="New task title..."
            className="flex-1 bg-slate-800 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 px-5 py-2 rounded-lg font-medium"
          >
            + Add Task
          </button>
        </form>

        {loading ? (
          <p className="text-slate-400">Loading tasks...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {COLUMNS.map((col) => (
              <div key={col.key} className="bg-slate-800/50 rounded-xl p-4">
                <h3 className="font-semibold text-slate-300 mb-4">
                  {col.label} ({tasks.filter((t) => t.status === col.key).length})
                </h3>

                <div className="space-y-3">
                  {tasks
                    .filter((task) => task.status === col.key)
                    .map((task) => (
                      <div key={task._id} className="bg-slate-700 rounded-lg p-3">
                        <p className="text-sm">{task.title}</p>

                        <div className="flex justify-between items-center mt-3">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                            className="bg-slate-600 text-xs rounded px-2 py-1 outline-none"
                          >
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>

                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BoardView;