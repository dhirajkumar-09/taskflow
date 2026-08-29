import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter
} from '@dnd-kit/core';

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
];

const socket = io('http://localhost:5000');

function TaskCard({ task, onDelete }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: task._id
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-slate-700 rounded-lg p-3 cursor-grab active:cursor-grabbing"
    >
      <p className="text-sm">{task.title}</p>
      <div className="flex justify-end mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task._id);
          }}
          className="text-red-400 hover:text-red-300 text-xs"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function Column({ column, tasks, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.key });

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-800/50 rounded-xl p-4 min-h-[200px] transition ${
        isOver ? 'ring-2 ring-indigo-500' : ''
      }`}
    >
      <h3 className="font-semibold text-slate-300 mb-4">
        {column.label} ({tasks.length})
      </h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}

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

    // Join this board's real-time room
    socket.emit('joinBoard', id);

    // Listen for real-time events
    const handleTaskCreated = (newTask) => {
      setTasks((prev) => {
        if (prev.some((t) => t._id === newTask._id)) return prev;
        return [...prev, newTask];
      });
    };

    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );
    };

    const handleTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);

    // Cleanup listeners when leaving this board
    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
    };
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
      // No need to call fetchTasks() — the socket event will add it
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      // No need to call fetchTasks() — the socket event will remove it
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id;
    const newStatus = over.id;

    const task = tasks.find((t) => t._id === taskId);
    if (task && task.status !== newStatus) {
      handleStatusChange(taskId, newStatus);
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
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {COLUMNS.map((col) => (
                <Column
                  key={col.key}
                  column={col}
                  tasks={tasks.filter((t) => t.status === col.key)}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          </DndContext>
        )}
      </div>
    </div>
  );
}

export default BoardView;