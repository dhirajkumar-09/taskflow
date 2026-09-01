import { useState } from 'react';
import Avatar from './Avatar';
import { authFetch } from '../utils/api';

const PRIORITIES = [
  { key: 'low', label: 'Low', color: '#8b93a7' },
  { key: 'medium', label: 'Medium', color: '#f59e0b' },
  { key: 'high', label: 'High', color: '#f87171' }
];

const STATUS_LABEL = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done' };
const STATUS_COLOR = { todo: '#8b93a7', 'in-progress': '#6366f1', done: '#10b981' };

// Mirrors the backend's progress -> column rule exactly. Status is never
// something anyone picks directly — it's always earned by real progress.
const deriveStatus = (progress) => {
  const p = Number(progress) || 0;
  if (p >= 100) return 'done';
  if (p >= 50) return 'in-progress';
  return 'todo';
};

// Turns a ISO date string into a yyyy-mm-dd value for <input type="date">
const toDateInputValue = (isoDate) => {
  if (!isoDate) return '';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
};

// Days remaining until the due date (negative = overdue), null if no due date set
const daysRemaining = (isoDate) => {
  if (!isoDate) return null;
  const due = new Date(isoDate);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today) / (1000 * 60 * 60 * 24));
};

const formatBytes = (bytes) => {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

const readAsBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });

function TaskModal({ task, members, onClose, onSave, onDelete, isLeader, currentUserId }) {
  const isAssignee = !!(task.assignee && task.assignee._id === currentUserId);
  const canEditDetails = !!isLeader;
  const canUpdateProgress = isLeader || isAssignee;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [assignee, setAssignee] = useState(task.assignee ? task.assignee._id : '');
  const [dueDate, setDueDate] = useState(toDateInputValue(task.dueDate));
  const [progress, setProgress] = useState(task.progress ?? 0);
  const [progressNote, setProgressNote] = useState(task.progressNote || '');
  const [saving, setSaving] = useState(false);
  const [liveTask, setLiveTask] = useState(task);

  const remaining = daysRemaining(dueDate);
  const previewStatus = deriveStatus(progress);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResult, setAiResult] = useState(null); // { steps: [...], tip: '' }

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [reacting, setReacting] = useState(false);

  const attachments = liveTask.attachments || [];
  const comments = liveTask.comments || [];
  const reactions = liveTask.reactions || [];
  const likeCount = reactions.filter((r) => r.type === 'like').length;
  const iAlreadyLiked = reactions.some((r) => r.type === 'like' && r.user && r.user._id === currentUserId);

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
    const updates = {};

    if (canEditDetails) {
      if (!title.trim()) return;
      updates.title = title;
      updates.description = description;
      updates.priority = priority;
      updates.assignee = assignee || null;
      updates.dueDate = dueDate || null;
    }

    if (canUpdateProgress) {
      updates.progress = progress;
      updates.progressNote = progressNote;
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      await onSave(task._id, updates);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploadError('');
    setUploading(true);
    try {
      const encoded = await Promise.all(
        files.map(async (f) => ({ name: f.name, mimeType: f.type, data: await readAsBase64(f) }))
      );
      const res = await authFetch(`/api/tasks/${task._id}/attachments`, {
        method: 'POST',
        body: JSON.stringify({ files: encoded })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      setLiveTask(data.task);
    } catch (err) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachmentId, originalName) => {
    try {
      const res = await authFetch(`/api/tasks/${task._id}/attachments/${attachmentId}`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName || 'attachment';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    try {
      const res = await authFetch(`/api/tasks/${task._id}/attachments/${attachmentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) setLiveTask(data.task);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      const res = await authFetch(`/api/tasks/${task._id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Could not post response');
      setLiveTask(data.task);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setPostingComment(false);
    }
  };

  const handleToggleLike = async () => {
    setReacting(true);
    try {
      const res = await authFetch(`/api/tasks/${task._id}/react`, {
        method: 'POST',
        body: JSON.stringify({ type: 'like' })
      });
      const data = await res.json();
      if (res.ok) setLiveTask(data.task);
    } catch (err) {
      console.error(err);
    } finally {
      setReacting(false);
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
        <div className="flex items-start justify-between mb-1 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            readOnly={!canEditDetails}
            className="flex-1 bg-transparent outline-none font-display font-semibold text-xl text-white disabled:opacity-70"
            placeholder="Task title"
          />
          <button onClick={onClose} className="shrink-0 p-1 rounded transition" style={{ color: 'var(--text-muted)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {!canEditDetails && (
          <p className="text-[11px] mb-4" style={{ color: 'var(--text-muted)' }}>
            Set by your leader — you can update progress, attach work, and report status below.
          </p>
        )}
        {canEditDetails && <div className="mb-4" />}

        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Description</label>
          {canEditDetails && (
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
          )}
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          readOnly={!canEditDetails}
          rows={3}
          placeholder="Add more detail..."
          className="w-full rounded-xl px-3.5 py-2.5 outline-none transition text-sm resize-none disabled:opacity-70"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />

        {canEditDetails && (
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
        )}
        {!canEditDetails && <div className="mb-5" />}

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Status</label>
            <div
              className="w-full rounded-xl px-3 py-2.5 text-sm font-medium"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: STATUS_COLOR[previewStatus] }}
            >
              {STATUS_LABEL[previewStatus]}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Priority</label>
            {canEditDetails ? (
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 outline-none text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {PRIORITIES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
              </select>
            ) : (
              <div
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {PRIORITIES.find((p) => p.key === priority)?.label || priority}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>Deadline</label>
            {canEditDetails ? (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl px-3 py-2.5 outline-none text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
            ) : (
              <div
                className="w-full rounded-xl px-3 py-2.5 text-sm"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {dueDate || 'No deadline set'}
              </div>
            )}
            {dueDate && (
              <p
                className="text-[11px] mt-1.5"
                style={{ color: remaining !== null && remaining < 0 && previewStatus !== 'done' ? 'var(--danger)' : 'var(--text-muted)' }}
              >
                {remaining === null
                  ? ''
                  : remaining < 0
                  ? `${Math.abs(remaining)} din late ho gaya`
                  : remaining === 0
                  ? 'Aaj deadline hai'
                  : `${remaining} din baaki`}
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Progress</label>
              <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              disabled={!canUpdateProgress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full disabled:opacity-50"
              style={{ accentColor: 'var(--accent)' }}
            />
            <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--bg)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))' }}
              />
            </div>
            {!canUpdateProgress && (
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Only the assignee or leader can update this</p>
            )}
          </div>
        </div>

        {canUpdateProgress && (
          <div className="mb-5">
            <label className="text-xs font-medium block mb-1.5" style={{ color: 'var(--text-muted)' }}>
              Progress report {isLeader ? '' : '(to your leader)'}
            </label>
            <textarea
              value={progressNote}
              onChange={(e) => setProgressNote(e.target.value)}
              rows={2}
              placeholder="What did you get done? Any blockers?"
              className="w-full rounded-xl px-3.5 py-2.5 outline-none transition text-sm resize-none"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
        )}

        <div className="mb-6">
          <label className="text-xs font-medium block mb-2" style={{ color: 'var(--text-muted)' }}>Assigned to</label>
          {canEditDetails ? (
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
          ) : (
            <div className="flex items-center gap-1.5">
              <Avatar name={task.assignee ? task.assignee.name : ''} size={22} />
              <span className="text-sm" style={{ color: 'var(--text)' }}>{task.assignee ? task.assignee.name : 'Unassigned'}</span>
            </div>
          )}
        </div>

        <div className="mb-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Attachments</label>
            {(isLeader || isAssignee) && (
              <label
                className="text-xs font-medium px-2.5 py-1 rounded-full transition cursor-pointer"
                style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)' }}
              >
                {uploading ? 'Uploading...' : '+ Attach file'}
                <input type="file" multiple onChange={handleFileChange} disabled={uploading} className="hidden" />
              </label>
            )}
          </div>
          {uploadError && <p className="text-xs mb-2" style={{ color: 'var(--danger)' }}>{uploadError}</p>}
          {attachments.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No files attached yet</p>
          ) : (
            <div className="space-y-1.5">
              {attachments.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <button
                    onClick={() => handleDownload(a._id, a.originalName)}
                    className="flex-1 min-w-0 text-left truncate transition"
                    style={{ color: 'var(--text)' }}
                    title={a.originalName}
                  >
                    📎 {a.originalName}
                    <span style={{ color: 'var(--text-muted)' }}> · {formatBytes(a.size)}{a.uploadedBy ? ` · ${a.uploadedBy.name}` : ''}</span>
                  </button>
                  {(isLeader || (a.uploadedBy && a.uploadedBy._id === currentUserId)) && (
                    <button
                      onClick={() => handleDeleteAttachment(a._id)}
                      className="shrink-0"
                      style={{ color: 'var(--danger)' }}
                      title="Remove attachment"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Leader review</label>
            <button
              onClick={isLeader ? handleToggleLike : undefined}
              disabled={!isLeader || reacting}
              className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition disabled:cursor-default"
              style={{
                background: iAlreadyLiked ? 'rgba(236,72,153,0.15)' : 'var(--bg)',
                color: iAlreadyLiked ? '#ec4899' : 'var(--text-muted)',
                border: '1px solid var(--border)'
              }}
              title={isLeader ? 'Like this progress update' : `${likeCount} like${likeCount === 1 ? '' : 's'}`}
            >
              {iAlreadyLiked ? '❤️' : '🤍'} {likeCount}
            </button>
          </div>

          {comments.length === 0 ? (
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>No responses yet</p>
          ) : (
            <div className="space-y-2 mb-3">
              {comments.map((c) => (
                <div key={c._id} className="rounded-lg px-3 py-2 text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Avatar name={c.author ? c.author.name : ''} size={16} />
                    <span className="font-medium" style={{ color: 'var(--text)' }}>{c.author ? c.author.name : 'Leader'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p style={{ color: 'var(--text)' }}>{c.text}</p>
                </div>
              ))}
            </div>
          )}

          {isLeader && (
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Respond to this progress update..."
                className="flex-1 rounded-lg px-3 py-2 outline-none text-xs"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <button
                onClick={handlePostComment}
                disabled={postingComment || !commentText.trim()}
                className="text-xs font-medium px-3 py-2 rounded-lg transition disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'white' }}
              >
                {postingComment ? '...' : 'Send'}
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          {isLeader ? (
            <button
              onClick={() => { onDelete(task._id); onClose(); }}
              className="text-sm font-medium px-4 py-2.5 rounded-xl transition"
              style={{ color: 'var(--danger)' }}
            >
              Delete task
            </button>
          ) : <span />}
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