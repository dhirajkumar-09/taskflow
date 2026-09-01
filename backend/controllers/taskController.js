const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Task = require('../models/Task');
const Board = require('../models/Board');
const { validationResult } = require('express-validator');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'tasks');
const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024; // 8MB per file
const MAX_ATTACHMENTS_PER_REQUEST = 5;

// Returns: null if board doesn't exist, false if the user has no access,
// or the board document if the user is the owner or a member.
const verifyBoardAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId);
  if (!board) return null;
  const hasAccess = board.owner.toString() === userId ||
    board.members.some((m) => m.toString() === userId);
  if (!hasAccess) return false;
  return board;
};

// The board owner is the Admin/Leader. Everyone else is a Board Member/User.
const isBoardLeader = (board, userId) => board.owner.toString() === userId;

// The task board is strictly progress-driven — status is NEVER trusted from
// the client. This is the single source of truth on the server so nobody
// (drag-and-drop, direct API calls, or manual DB edits through the app)
// can move a task to a column its progress hasn't earned.
const deriveStatus = (progress) => {
  const p = Number(progress) || 0;
  if (p >= 100) return 'done';
  if (p >= 50) return 'in-progress';
  return 'todo';
};

const populateTask = (query) =>
  query
    .populate('assignee', 'name email')
    .populate('createdBy', 'name email')
    .populate('attachments.uploadedBy', 'name email')
    .populate('comments.author', 'name email')
    .populate('reactions.user', 'name email');

// Fields only the Admin/Leader may set. Board Members/Users can never
// change what a task is, who owns it, when it's due, or how urgent it is —
// they can only report real progress on the work itself.
const LEADER_ONLY_FIELDS = ['title', 'description', 'priority', 'assignee', 'dueDate'];

// Create a new task — only the board leader can assign/create tasks
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, boardId, assignee, dueDate } = req.body;

    const board = await verifyBoardAccess(boardId, req.userId);
    if (board === null) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board === false) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this board' });
    }

    if (!isBoardLeader(board, req.userId)) {
      return res.status(403).json({ message: 'Only the board leader can create and assign tasks' });
    }

    if (assignee && !board.members.some((m) => m.toString() === assignee) && board.owner.toString() !== assignee) {
      return res.status(400).json({ message: 'Assignee must be a member of this board' });
    }

    const newTask = new Task({
      title,
      description,
      status: 'todo',
      priority: priority || 'medium',
      assignee: assignee || null,
      dueDate: dueDate || null,
      progress: 0,
      board: boardId,
      createdBy: req.userId
    });

    await newTask.save();
    const populated = await populateTask(Task.findById(newTask._id));

    // Notify everyone in this board's room that a new task was created
    const io = req.app.get('io');
    io.to(boardId).emit('taskCreated', populated);

    res.status(201).json({ message: 'Task created successfully', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tasks for a specific board
const getTasks = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await verifyBoardAccess(boardId, req.userId);
    if (board === null) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board === false) {
      return res.status(403).json({ message: 'Not authorized to view tasks of this board' });
    }

    const tasks = await populateTask(Task.find({ board: boardId }).sort({ createdAt: 1 }));
    res.status(200).json(tasks);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a task — strict, role-based field permissions.
// Leader: title, description, priority, assignee, dueDate (full control).
// Assignee: progress + progressNote only (their actual reported work).
// Status is always derived from progress on the server; the client's
// `status` field (e.g. from a drag-and-drop) is never trusted.
const updateTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await verifyBoardAccess(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const leader = isBoardLeader(board, req.userId);
    const assignee = task.assignee && task.assignee.toString() === req.userId;

    if (!leader && !assignee) {
      return res.status(403).json({ message: 'You can only work on tasks assigned to you' });
    }

    const attemptedLeaderFields = LEADER_ONLY_FIELDS.filter((f) => req.body[f] !== undefined);
    if (!leader && attemptedLeaderFields.length > 0) {
      return res.status(403).json({
        message: 'Only the board leader can change task deadline, priority, assignee or details'
      });
    }

    // A client-provided `status` (e.g. from a drag-and-drop) is always
    // ignored — it is silently discarded and recalculated from progress
    // below, whoever sends it.

    const { title, description, priority, assignee: newAssignee, dueDate, progress, progressNote } = req.body;

    if (leader) {
      if (newAssignee !== undefined && newAssignee !== null &&
        !board.members.some((m) => m.toString() === newAssignee) && board.owner.toString() !== newAssignee) {
        return res.status(400).json({ message: 'Assignee must be a member of this board' });
      }

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (priority !== undefined) task.priority = priority;
      if (newAssignee !== undefined) task.assignee = newAssignee || null;
      if (dueDate !== undefined) task.dueDate = dueDate || null;
    }

    if (progress !== undefined) {
      if (!leader && !assignee) {
        return res.status(403).json({ message: 'You can only update progress on tasks assigned to you' });
      }
      const clamped = Math.max(0, Math.min(100, Math.round(Number(progress))));
      task.progress = clamped;
    }

    if (progressNote !== undefined) {
      if (!leader && !assignee) {
        return res.status(403).json({ message: 'You can only report progress on tasks assigned to you' });
      }
      task.progressNote = progressNote;
    }

    // The status a client sends (drag-and-drop or otherwise) is never
    // trusted — it is always recomputed here from the real progress value,
    // so a 30% task can never land in "In Progress" or "Done", and a task
    // can only reach "Done" by actually reaching 100% progress.
    task.status = deriveStatus(task.progress);

    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    // Notify everyone in this board's room that a task was updated
    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', populated);

    res.status(200).json({ message: 'Task updated successfully', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a task — leader (board owner) only. Members cannot delete tasks,
// including tasks assigned to them.
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await verifyBoardAccess(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    if (!isBoardLeader(board, req.userId)) {
      return res.status(403).json({ message: 'Only the board leader can delete tasks' });
    }

    const boardId = task.board.toString();
    const taskId = task._id.toString();

    // Clean up any attached files on disk
    const taskDir = path.join(UPLOAD_ROOT, taskId);
    if (fs.existsSync(taskDir)) {
      fs.rmSync(taskDir, { recursive: true, force: true });
    }

    await task.deleteOne();

    // Notify everyone in this board's room that a task was deleted
    const io = req.app.get('io');
    io.to(boardId).emit('taskDeleted', { taskId });

    res.status(200).json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload work-related attachments (documents/photos) for a task.
// Only the leader or the task's assignee can attach files — accepted as
// base64-encoded payloads so no extra upload middleware is required.
const addAttachments = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await verifyBoardAccess(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    const leader = isBoardLeader(board, req.userId);
    const assignee = task.assignee && task.assignee.toString() === req.userId;
    if (!leader && !assignee) {
      return res.status(403).json({ message: 'You can only attach files to tasks assigned to you' });
    }

    const files = Array.isArray(req.body.files) ? req.body.files : [];
    if (files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }
    if (files.length > MAX_ATTACHMENTS_PER_REQUEST) {
      return res.status(400).json({ message: `You can attach up to ${MAX_ATTACHMENTS_PER_REQUEST} files at a time` });
    }

    const taskDir = path.join(UPLOAD_ROOT, task._id.toString());
    fs.mkdirSync(taskDir, { recursive: true });

    const saved = [];
    for (const file of files) {
      const { name, mimeType, data } = file || {};
      if (!name || !data) continue;

      const base64 = String(data).includes(',') ? String(data).split(',').pop() : String(data);
      const buffer = Buffer.from(base64, 'base64');
      if (buffer.length === 0) continue;
      if (buffer.length > MAX_ATTACHMENT_BYTES) {
        return res.status(400).json({ message: `${name} is larger than the 8MB limit` });
      }

      const safeOriginal = path.basename(String(name)).slice(0, 150);
      const storedName = `${crypto.randomUUID()}__${safeOriginal}`;
      fs.writeFileSync(path.join(taskDir, storedName), buffer);

      const attachment = {
        originalName: safeOriginal,
        storedName,
        mimeType: mimeType || 'application/octet-stream',
        size: buffer.length,
        uploadedBy: req.userId,
        uploadedAt: new Date()
      };
      task.attachments.push(attachment);
      saved.push(attachment);
    }

    if (saved.length === 0) {
      return res.status(400).json({ message: 'No valid files provided' });
    }

    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', populated);

    res.status(201).json({ message: 'Attachment(s) uploaded', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Download/view a task attachment — any board member (leader or user) can
// view work the assignee has attached.
const downloadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await verifyBoardAccess(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const filePath = path.join(UPLOAD_ROOT, task._id.toString(), attachment.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File no longer exists' });
    }

    res.setHeader('Content-Type', attachment.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(attachment.originalName)}"`);
    fs.createReadStream(filePath).pipe(res);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete an attachment — the leader (moderation) or the member who
// uploaded it can remove it.
const deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await verifyBoardAccess(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    const leader = isBoardLeader(board, req.userId);
    const attachment = task.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    const uploadedByThisUser = attachment.uploadedBy && attachment.uploadedBy.toString() === req.userId;
    if (!leader && !uploadedByThisUser) {
      return res.status(403).json({ message: 'Not authorized to remove this attachment' });
    }

    const filePath = path.join(UPLOAD_ROOT, task._id.toString(), attachment.storedName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    attachment.deleteOne();
    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', populated);

    res.status(200).json({ message: 'Attachment removed', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Leader responds to a member's progress update
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await verifyBoardAccess(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    if (!isBoardLeader(board, req.userId)) {
      return res.status(403).json({ message: 'Only the board leader can respond to progress updates' });
    }

    task.comments.push({ author: req.userId, text: text.trim(), createdAt: new Date() });
    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', populated);

    res.status(201).json({ message: 'Comment added', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Leader likes/reacts to a task's progress (toggles their own reaction)
const toggleReaction = async (req, res) => {
  try {
    const type = (req.body.type || 'like').trim();

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const board = await verifyBoardAccess(task.board, req.userId);
    if (board === false || board === null) {
      return res.status(403).json({ message: 'Not authorized to access this task' });
    }

    if (!isBoardLeader(board, req.userId)) {
      return res.status(403).json({ message: 'Only the board leader can react to progress updates' });
    }

    const existingIndex = task.reactions.findIndex(
      (r) => r.user.toString() === req.userId && r.type === type
    );

    if (existingIndex >= 0) {
      task.reactions.splice(existingIndex, 1);
    } else {
      task.reactions.push({ user: req.userId, type, createdAt: new Date() });
    }

    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', populated);

    res.status(200).json({ message: 'Reaction updated', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  addAttachments,
  downloadAttachment,
  deleteAttachment,
  addComment,
  toggleReaction
};