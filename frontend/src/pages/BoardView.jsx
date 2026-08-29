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
  { key: 'todo', label: 'To Do', color: '#8b93a7' },
  { key: 'in-progress', label: 'In Progress', color: '#6366f1' },
  { key: 'done', label: 'Done', color: '#10b981' }
];

const socket = io('http://localhost:5000');

function TaskCard({ task, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 50,
        opacity: isDragging ? 0.6 : 1
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      {...listeners}
      {...attributes}
      className="group rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-white leading-snug">{task.title}</p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task._id);
          }}
          className="opacity-0 group-hover:opacity-100 transition shrink-0"
          style={{ color: 'var(--danger)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
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
      className="rounded-2xl p-4 min-h-[240px] transition"
      style={{
        background: 'var(--surface)',
        border: isOver ? `1px solid ${column.color}` : '1px solid var(--border)',
        boxShadow: isOver ? `0 0 0 3px ${column.color}22` : 'none'
      }}
    >
      <div className="flex items-center gap-2 mb-4 px-1">
        <span className="w-2 h-2 rounded-full" style={{ background: column.color }}></span>
        <h3 className="font-medium text-sm" style={{ color: 'var(--text-muted)' }}>
          {column.label}
        </h3>
        <span
          className="text-xs px-1.5 py-0.5 rounded-full ml-auto"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
        >
          {tasks.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div
            className="text-xs text-center py-8 rounded-xl"
            style={{ border: '1px dashed var(--border)', color: 'var(--text-muted)' }}
          >
            No tasks here
          </div>
        ) : (
          tasks.map((task) => <TaskCard key={task._id} task={task} onDelete={onDelete} />)
        )}
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
    socket.emit('joinBoard', id);

    const handleTaskCreated = (newTask) => {
      setTasks((prev) => (prev.some((t) => t._id === newTask._id) ? prev : [...prev, newTask]));
    };
    const handleTaskUpdated = (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    };
    const handleTaskDeleted = ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    };

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTaskTitle, boardId: id })
      });
      setNewTaskTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
    try {
      await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t._id === active.id);
    if (task && task.status !== over.id) {
      handleStatusChange(active.id, over.id);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="flex justify-between items-center px-8 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm flex items-center gap-1.5 transition"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Boards
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
            <span className="font-display text-white text-xs font-bold">T</span>
          </div>
          <span className="font-display text-white text-sm font-semibold">TaskFlow</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 fade-in-up">
        <form onSubmit={handleAddTask} className="flex gap-3 mb-8">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to get done?"
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
            + Add Task
          </button>
        </form>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }}></div>
            ))}
          </div>
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