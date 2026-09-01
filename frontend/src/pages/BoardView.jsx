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

function TaskCard({ task, onDelete, onOpen, canDelete }) {
  const remaining = daysRemaining(task.dueDate);
  const overdue = remaining !== null && remaining < 0 && task.status !== 'done';
  const progress = task.progress ?? 0;
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
      onClick={() => onOpen(task)}
      className="group rounded-xl p-3.5 cursor-grab active:cursor-grabbing transition hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <span
          className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{ background: `${PRIORITY_COLOR[task.priority || 'medium']}22`, color: PRIORITY_COLOR[task.priority || 'medium'] }}
        >
          {task.priority || 'medium'}
        </span>
        {canDelete && (
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
        )}
      </div>

      <p className="text-sm text-white leading-snug mb-3">{task.title}</p>

      {task.assignee && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Progress</span>
            <span className="text-[10px] font-semibold" style={{ color: 'var(--accent)' }}>{progress}%</span>
          </div>
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: overdue ? 'var(--danger)' : 'var(--text-muted)' }}>
          {task.dueDate
            ? overdue
              ? `${Math.abs(remaining)} din late`
              : remaining === 0
              ? 'Aaj deadline'
              : `${remaining} din baaki`
            : new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
        <Avatar name={task.assignee ? task.assignee.name : ''} size={22} title={task.assignee ? task.assignee.name : 'Unassigned'} />
      </div>
    </div>
  );
}

function Column({ column, tasks, onDelete, onOpen, canDelete }) {
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
          tasks.map((task) => (
            <TaskCard key={task._id} task={task} onDelete={onDelete} onOpen={onOpen} canDelete={canDelete} />
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
  const isOwner = board && board.owner && board.owner._id === currentUser.id;

  const people = useMemo(
    () => members.map((m) => ({ ...m, isOwner: board?.owner && m._id === board.owner._id })),
    [members, board]
  );

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
      await authFetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
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

  // The board is strictly progress-driven: a task's column is determined
  // by its actual progress %, never by dragging. Dropping a task on a
  // different column never sends a status change — it just snaps back and
  // explains why, so a 30%/75% task can't be bypassed into a later column.
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t._id === active.id);
    if (!task) return;
    const actualColumn = deriveStatus(task.progress);
    if (over.id !== actualColumn) {
      const label = COLUMNS.find((c) => c.key === actualColumn)?.label || actualColumn;
      setDragBlockedMsg(`This task is ${task.progress ?? 0}% done, so it stays in "${label}". Open it to update progress.`);
      window.clearTimeout(handleDragEnd._t);
      handleDragEnd._t = window.setTimeout(() => setDragBlockedMsg(''), 3200);
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
        {error && !board && (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-lg font-semibold text-white mb-2">Can't open this board</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{error}</p>
          </div>
        )}

        {board && (
        <>
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">{board ? board.name : 'Loading...'}</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {people.length} member{people.length !== 1 ? 's' : ''} · {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAiAssistOpen(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full transition shrink-0"
              style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
              title="Ask AI how to finish this board faster"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2zM19 14l.8 2.6L22 17.5l-2.2.9L19 21l-.8-2.6-2.2-.9 2.2-.9L19 14z" />
              </svg>
              AI Team Assistant
            </button>
          <div className="flex items-center -space-x-2.5">
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
            currentUserId={currentUser.id}
            onRemove={handleRemoveMember}
          />
        )}

        {isOwner && (
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
              title="Only the leader sets priority"
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
              placeholder="Din me khatam?"
              title="Kitne dino me task khatam karna hai"
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
        )}

        {dragBlockedMsg && (
          <div
            className="text-xs rounded-lg px-3.5 py-2.5 mb-5"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
          >
            {dragBlockedMsg}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }}></div>
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {COLUMNS.map((col) => (
                <Column
                  key={col.key}
                  column={col}
                  tasks={tasks.filter((t) => t.status === col.key)}
                  onDelete={handleDeleteTask}
                  onOpen={setActiveTask}
                  canDelete={isOwner}
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
      {board && activeTask && (
        <TaskModal
          task={activeTask}
          members={people}
          onClose={() => setActiveTask(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
          isLeader={isOwner}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}

export default BoardView;