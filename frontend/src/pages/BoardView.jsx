import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../utils/socket';
import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor
} from '@dnd-kit/core';
import { authFetch } from '../utils/api';
import Avatar from '../components/Avatar';
import TeamPanel from '../components/TeamPanel';
import InviteMemberModal from '../components/InviteMemberModal';
import TaskModal from '../components/TaskModal';
import AIBoardAssistModal from '../components/AIBoardAssistModal';
import FilterBar from '../components/FilterBar';
import CalendarView from '../components/CalendarView';
import ThemeToggle from '../components/ThemeToggle';
import BoardAnalyticsModal from '../components/BoardAnalyticsModal';
import { exportCSV, exportPDF } from '../utils/export';

const COLUMNS = [
  { key: 'todo', label: 'To Do', color: '#8b93a7' },
  { key: 'in-progress', label: 'In Progress', color: '#6366f1' },
  { key: 'done', label: 'Done', color: '#10b981' }
];

const PRIORITIES = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' }
];

const PRIORITY_COLOR = { low: '#8b93a7', medium: '#f59e0b', high: '#f87171' };

// Mirrors the server's progress -> column mapping so the board never shows
// (even for a split second) a state the backend wouldn't allow.
const deriveStatus = (progress) => {
  const p = Number(progress) || 0;
  if (p >= 100) return 'done';
  if (p >= 50) return 'in-progress';
  return 'todo';
};

// Days remaining until a due date (negative = overdue), null if no due date
const daysRemaining = (isoDate) => {
  if (!isoDate) return null;
  const due = new Date(isoDate);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
};

function TaskCard({ task, onDelete, onOpen, canDelete, onToggleComplete }) {
  const remaining = daysRemaining(task.dueDate);
  const overdue = remaining !== null && remaining < 0 && task.status !== 'done';
  const progress = task.progress ?? 0;
  const isDone = task.status === 'done';
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
      style={{
        ...style,
        background: isDone ? 'rgba(16,19,30,0.6)' : 'var(--surface-2)',
        border: isDone ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border)'
      }}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(task)}
      className="group rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: `${PRIORITY_COLOR[task.priority || 'medium']}22`, color: PRIORITY_COLOR[task.priority || 'medium'] }}
          >
            {task.priority || 'medium'}
          </span>
          {(task.labels || []).slice(0, 3).map((lbl, idx) => (
            <span
              key={idx}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
            >
              #{lbl}
            </span>
          ))}
        </div>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task._id);
            }}
            className="opacity-70 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition shrink-0 p-1 rounded hover:bg-red-500/10"
            style={{ color: 'var(--danger)' }}
            title="Delete task"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      <div className="flex items-start gap-2.5 mb-3">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onToggleComplete) onToggleComplete(task);
          }}
          className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center transition shrink-0 group/check"
          style={{
            border: isDone ? '1.5px solid var(--success)' : '1.5px solid var(--border)',
            background: isDone ? 'var(--success)' : 'transparent'
          }}
          title={isDone ? 'Mark as incomplete' : 'Mark as done'}
        >
          {isDone ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-0 group-hover/check:opacity-100 transition">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        <p className={`text-sm leading-snug flex-1 transition ${isDone ? 'line-through' : ''}`} style={{ color: isDone ? 'var(--text-muted)' : 'var(--text)' }}>
          {task.title}
        </p>
      </div>

      {task.assignee && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Progress</span>
            <span className="text-[10px] font-semibold" style={{ color: isDone ? 'var(--success)' : 'var(--accent)' }}>{progress}%</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: isDone ? 'var(--success)' : 'linear-gradient(90deg, var(--accent), var(--accent-2))'
              }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px]" style={{ color: isDone ? 'var(--success)' : overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
          {isDone ? (
            '✓ Completed'
          ) : task.dueDate ? (
            overdue
              ? `${Math.abs(remaining)} Days late`
              : remaining === 0
              ? 'Aaj deadline'
              : `${remaining} Days baaki`
          ) : (
            new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
          )}
        </span>
        <Avatar name={task.assignee ? task.assignee.name : ''} size={22} title={task.assignee ? task.assignee.name : 'Unassigned'} />
      </div>
    </div>
  );
}

function Column({ column, tasks, onDelete, onOpen, canDelete, onToggleComplete }) {
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
            Drop tasks here
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onDelete={onDelete}
              onOpen={onOpen}
              canDelete={canDelete}
              onToggleComplete={onToggleComplete}
            />
          ))
        )}
      </div>
    </div>
  );
}

function BoardView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDays, setNewTaskDays] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('medium');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dragBlockedMsg, setDragBlockedMsg] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [aiAssistOpen, setAiAssistOpen] = useState(false);

  // View toggle: 'board' or 'calendar'
  const [view, setView] = useState('board');

  // Search / filter state
  const [filters, setFilters] = useState({ search: '', priority: '', assignee: '', labels: [] });

  // Modals & Export dropdown
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Require a small pointer movement before dnd-kit treats it as a drag.
  // Without this, every click is first evaluated as a potential drag,
  // which is what made the task modal feel slow to open.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const fetchBoard = async () => {
    try {
      const res = await authFetch(`/api/boards/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 403
          ? "You don't have access to this board. Ask the owner to invite you."
          : (data.message || 'Failed to load board'));
        return;
      }
      setBoard(data);
    } catch (err) {
      if (err.message !== 'Session expired') setError('Failed to load board');
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await authFetch(`/api/tasks/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError((prev) => prev || data.message || 'Failed to load tasks');
        setTasks([]);
        return;
      }
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoard();
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
    const handleBoardChanged = (updatedBoard) => setBoard(updatedBoard);

    socket.on('taskCreated', handleTaskCreated);
    socket.on('taskUpdated', handleTaskUpdated);
    socket.on('taskDeleted', handleTaskDeleted);
    socket.on('boardUpdated', handleBoardChanged);
    socket.on('memberAdded', handleBoardChanged);
    socket.on('memberRemoved', handleBoardChanged);

    return () => {
      socket.off('taskCreated', handleTaskCreated);
      socket.off('taskUpdated', handleTaskUpdated);
      socket.off('taskDeleted', handleTaskDeleted);
      socket.off('boardUpdated', handleBoardChanged);
      socket.off('memberAdded', handleBoardChanged);
      socket.off('memberRemoved', handleBoardChanged);
    };
  }, [id]);

  const members = board?.members || [];
  const currentUserId = currentUser?.id || currentUser?._id;
  const ownerId = board?.owner?._id || board?.owner;
  const isOwner = Boolean(ownerId && currentUserId && ownerId.toString() === currentUserId.toString());

  const people = useMemo(
    () => members.map((m) => ({ ...m, isOwner: board?.owner && m._id === board.owner._id })),
    [members, board]
  );

  // All unique label strings across all tasks (for FilterBar)
  const allLabels = useMemo(() => {
    const set = new Set();
    for (const t of tasks) { (t.labels || []).forEach((l) => set.add(l)); }
    return Array.from(set);
  }, [tasks]);

  // Tasks after applying search + priority + assignee + label filters
  const filteredTasks = useMemo(() => {
    let result = tasks;
    const q = (filters.search || '').toLowerCase().trim();
    if (q) result = result.filter((t) => t.title.toLowerCase().includes(q));
    if (filters.priority) result = result.filter((t) => t.priority === filters.priority);
    if (filters.assignee === '__unassigned__') {
      result = result.filter((t) => !t.assignee);
    } else if (filters.assignee) {
      result = result.filter((t) => t.assignee && t.assignee._id === filters.assignee);
    }
    if ((filters.labels || []).length > 0) {
      result = result.filter((t) =>
        (filters.labels || []).every((l) => (t.labels || []).includes(l))
      );
    }
    return result;
  }, [tasks, filters]);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      let dueDate = null;
      const days = parseInt(newTaskDays, 10);
      if (!Number.isNaN(days) && days >= 0) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        dueDate = d.toISOString().slice(0, 10);
      }
      await authFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle,
          boardId: id,
          assignee: newTaskAssignee || null,
          dueDate,
          priority: newTaskPriority
        })
      });
      setNewTaskTitle('');
      setNewTaskAssignee('');
      setNewTaskDays('');
      setNewTaskPriority('medium');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      const res = await authFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error(err);
      fetchTasks();
    }
  };

  const handleUpdateTask = async (taskId, updates) => {
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update task');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleInvite = async (email) => {
    const res = await authFetch('/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ boardId: id, email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send invite');
    // Board itself is unchanged until they accept — nothing to update here.
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this person from the board?')) return;
    try {
      const res = await authFetch(`/api/boards/${id}/members/${userId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) setBoard(data.board);
    } catch (err) {
      console.error(err);
    }
  };

  // Fluid drag and drop: dropping onto a column updates its status and progress immediately!
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t._id === active.id);
    if (!task) return;
    const targetColumn = over.id; // 'todo', 'in-progress', 'done'
    if (['todo', 'in-progress', 'done'].includes(targetColumn) && task.status !== targetColumn) {
      let newProgress = task.progress ?? 0;
      if (targetColumn === 'done') newProgress = 100;
      else if (targetColumn === 'in-progress') newProgress = (newProgress >= 50 && newProgress < 100) ? newProgress : 50;
      else if (targetColumn === 'todo') newProgress = 0;

      // Optimistic local state update
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id
            ? { ...t, status: targetColumn, progress: newProgress }
            : t
        )
      );

      handleUpdateTask(task._id, { status: targetColumn, progress: newProgress }).catch((err) => {
        console.error('Drag update failed:', err);
      });
    }
  };

  const handleToggleComplete = async (task) => {
    const nextStatus = task.status === 'done' ? 'todo' : 'done';
    const nextProgress = nextStatus === 'done' ? 100 : 0;

    // Optimistic local state update
    setTasks((prev) =>
      prev.map((t) =>
        t._id === task._id ? { ...t, status: nextStatus, progress: nextProgress } : t
      )
    );

    try {
      await handleUpdateTask(task._id, { status: nextStatus, progress: nextProgress });
    } catch (err) {
      console.error('Toggle complete failed:', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav
        className="sticky top-0 z-30 flex justify-between items-center px-8 py-3.5 transition-colors"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)'
        }}
      >
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm flex items-center gap-1.5 transition hover:opacity-80"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Boards
        </button>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center glow-pulse" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
              <span className="font-display text-white text-xs font-bold">T</span>
            </div>
            <span className="font-display text-sm font-semibold" style={{ color: 'var(--text)' }}>TaskFlow</span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8 fade-in-up">
        {error && !board && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>Can't open this board</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        )}

        {board && (
        <>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>{board ? board.name : 'Loading...'}</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {people.length} member{people.length !== 1 ? 's' : ''} · {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* View toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
              <button
                onClick={() => setView('board')}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 transition"
                style={{
                  background: view === 'board' ? 'var(--accent)' : 'var(--surface)',
                  color: view === 'board' ? 'white' : 'var(--text-muted)'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="10" rx="1"/><rect x="14" y="17" width="7" height="4" rx="1"/>
                </svg>
                Board
              </button>
              <button
                onClick={() => setView('calendar')}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 transition"
                style={{
                  background: view === 'calendar' ? 'var(--accent)' : 'var(--surface)',
                  color: view === 'calendar' ? 'white' : 'var(--text-muted)'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Calendar
              </button>
            </div>

            {/* Analytics Button */}
            <button
              onClick={() => setAnalyticsOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition hover:opacity-90"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              title="View board analytics & performance"
            >
              <span>📊</span>
              Analytics
            </button>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setExportOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition hover:opacity-90"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                title="Export board data"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
              {exportOpen && (
                <div
                  className="absolute right-0 mt-1.5 w-36 rounded-xl py-1 z-40 shadow-2xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <button
                    onClick={() => { exportPDF(filteredTasks, board?.name); setExportOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/5 transition"
                    style={{ color: 'var(--text)' }}
                  >
                    <span>📄</span> PDF Report
                  </button>
                  <button
                    onClick={() => { exportCSV(filteredTasks, board?.name); setExportOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-white/5 transition"
                    style={{ color: 'var(--text)' }}
                  >
                    <span>📊</span> Excel / CSV
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setAiAssistOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl transition shrink-0"
              style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: 'var(--accent)' }}
              title="Ask AI how to finish this board faster"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2zM19 14l.8 2.6L22 17.5l-2.2.9L19 21l-.8-2.6-2.2-.9 2.2-.9L19 14z" />
              </svg>
              AI Assist
            </button>
            <div className="flex items-center -space-x-2.5 ml-1">
              {people.slice(0, 6).map((p) => <Avatar key={p._id} name={p.name} size={36} ring title={p.name} />)}
              {isOwner && (
                <button
                  onClick={() => setInviteOpen(true)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition shrink-0"
                  style={{ background: 'var(--surface-2)', border: '1.5px dashed var(--border)', color: 'var(--text-muted)', boxShadow: '0 0 0 2px var(--bg)' }}
                  title="Invite a member"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {error && <p style={{ color: 'var(--danger)' }} className="mb-4">{error}</p>}

        {!loading && (
          <TeamPanel
            people={people}
            tasks={tasks}
            onInvite={() => setInviteOpen(true)}
            isOwner={isOwner}
            currentUserId={currentUserId}
            onRemove={handleRemoveMember}
          />
        )}

        {/* FilterBar — always visible once board loaded */}
        {!loading && (
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            members={people}
            allLabels={allLabels}
          />
        )}

        <form onSubmit={handleAddTask} className="flex flex-wrap gap-3 mb-8">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="What needs to get done?"
            className="flex-1 min-w-[200px] rounded-lg px-4 py-2.5 outline-none transition"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
          <select
            value={newTaskAssignee}
            onChange={(e) => setNewTaskAssignee(e.target.value)}
            className="rounded-lg px-3 py-2.5 outline-none transition text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="">Unassigned</option>
            {people.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value)}
            className="rounded-lg px-3 py-2.5 outline-none transition text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label} priority</option>)}
          </select>
          <input
            type="number"
            min="0"
            value={newTaskDays}
            onChange={(e) => setNewTaskDays(e.target.value)}
            placeholder="complete in days?"
            title="How many days do we have to finish it?"
            className="w-[130px] rounded-lg px-3 py-2.5 outline-none transition text-sm"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
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
        ) : view === 'calendar' ? (
          <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <CalendarView tasks={filteredTasks} onOpen={setActiveTask} />
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {COLUMNS.map((col) => (
                <Column
                  key={col.key}
                  column={col}
                  tasks={filteredTasks.filter((t) => t.status === col.key)}
                  onDelete={handleDeleteTask}
                  onOpen={setActiveTask}
                  canDelete={isOwner}
                  onToggleComplete={handleToggleComplete}
                />
              ))}
            </div>
          </DndContext>
        )}
        </>
        )}
      </div>

      {board && inviteOpen && <InviteMemberModal onClose={() => setInviteOpen(false)} onInvite={handleInvite} />}
      {board && aiAssistOpen && <AIBoardAssistModal boardId={id} onClose={() => setAiAssistOpen(false)} />}
      {board && analyticsOpen && <BoardAnalyticsModal board={board} tasks={tasks} members={people} onClose={() => setAnalyticsOpen(false)} />}
      {board && activeTask && (
        <TaskModal
          task={activeTask}
          members={people}
          onClose={() => setActiveTask(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
          isLeader={isOwner}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
}

export default BoardView;
