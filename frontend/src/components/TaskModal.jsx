import { useState } from 'react';
import Avatar from './Avatar';
import { authFetch } from '../utils/api';

const PRIORITIES = [
  { key: 'low', label: 'Low', color: '#8b93a7' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'high', label: 'High', color: '#f87171' }
];

const COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done', label: 'Done' }
];

function TaskModal({ task, members, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [assignee, setAssignee] = useState(task.assignee ? task.assignee._id : '');
  const [saving, setSaving] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState(null); // { steps: [...], tip: '' }

  const handleAiBreakdown = async () => {
    if (!title.trim()) return;
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const res = await authFetch('/api/ai/breakdown', {
        method: 'POST',
        body: JSON.stringify({ title, description })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI assistant failed');
      setAiResult(data);
    } catch (err) {
      setAiError(err.message || 'Could not reach AI assistant');
    } finally {
      setAiLoading(false);
    }
  };

  const handleInsertSteps = () => {
    if (!aiResult?.steps?.length) return;
    const checklist = aiResult.steps.map((s) => `- [ ] ${s}`).join('\n');
    setDescription((prev) => (prev.trim() ? `${prev.trim()}\n\n${checklist}` : checklist));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(task._id, { title, description, status, priority, assignee: assignee || null });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,8,15,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 scale-in max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDuration: '0.2s' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-transparent outline-none font-display font-semibold text-xl text-white"
            placeholder="Task title"
          />
          <button onClick={onClose} className="shrink-0 p-1 rounded transition" style={{ color: 'var(--text-muted)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Description</label>
          <button
            type="button"
            onClick={handleAiBreakdown}
            disabled={aiLoading || !title.trim()}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition disabled:opacity-50"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
            title="Ask AI to break this task into steps"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2zM19 14l.8 2.6L22 17.5l-2.2.9L19 21l-.8-2.6-2.2-.9 2.2-.9L19 14z" />
            </svg>
            {aiLoading ? 'Thinking...' : 'Ask AI'}
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add more detail..."
          className="w-full rounded-xl px-3.5 py-2.5 outline-none transition text-sm resize-none"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        <div className="mb-5">
          {aiError && (
            <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{aiError}</p>
          )}

          {aiResult && (
            <div
              className="mt-3 rounded-xl p-3.5 text-sm"
              style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: 'var(--accent)' }}>
                ✨ AI suggested steps to finish this fast
              </p>
              <ol className="list-decimal list-inside space-y-1 mb-2" style={{ color: 'var(--text)' }}>
                {aiResult.steps.map((step, i) => (
                  <li key={i} className="text-sm">{step}</li>
                ))}
              </ol>
              {aiResult.tip && (
                <p className="text-xs italic mb-3" style={{ color: 'var(--text-muted)' }}>💡 {aiResult.tip}</p>
              )}
              <button
                type="button"
                onClick={handleInsertSteps}
                className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                Add checklist to description
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 outline-none text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-xl px-3 py-2.5 outline-none text-sm"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            >
              {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>Assigned to</label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAssignee('')}
              className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-medium transition"
              style={{
                background: assignee === '' ? 'var(--surface-2)' : 'transparent',
                border: `1px solid ${assignee === '' ? 'var(--accent)' : 'var(--border)'}`,
                color: 'var(--text)'
              }}
            >
              <Avatar name="" size={20} />
              Unassigned
            </button>
            {members.map((m) => (
              <button
                key={m._id}
                onClick={() => setAssignee(m._id)}
                className="flex items-center gap-1.5 pl-1.5 pr-3 py-1.5 rounded-full text-xs font-medium transition"
                style={{
                  background: assignee === m._id ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${assignee === m._id ? 'var(--accent)' : 'var(--border)'}`,
                  color: 'var(--text)'
                }}
              >
                <Avatar name={m.name} size={20} />
                {m.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={() => { onDelete(task._id); onClose(); }}
            className="text-sm font-medium px-4 py-2.5 rounded-xl transition"
            style={{ color: 'var(--danger)' }}
          >
            Delete task
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TaskModal;