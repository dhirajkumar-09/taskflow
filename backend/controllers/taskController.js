const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Task = require('../models/Task');
const Board = require('../models/Board');
const { validationResult } = require('express-validator');
const { pushNotification } = require('./notificationController');

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
    .populate('reactions.user', 'name email')
    .populate('activityLog.user', 'name email');

// Fields only the Admin/Leader may set.
const LEADER_ONLY_FIELDS = ['title', 'description', 'priority', 'assignee', 'dueDate', 'labels'];

// Helper: log an activity entry on the task
const logActivity = (task, userId, action, field, oldVal, newVal) => {
  task.activityLog.push({
    user: userId,
    action,
    field: field || '',
    oldVal: oldVal != null ? String(oldVal) : '',
    newVal: newVal != null ? String(newVal) : '',
    at: new Date()
  });
};

// Create a new task — only the board leader can assign/create tasks
const createTask = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, priority, boardId, assignee, dueDate, labels } = req.body;

    const board = await verifyBoardAccess(boardId, req.userId);
    if (board === null) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board === false) {
      return res.status(403).json({ message: 'Not authorized to add tasks to this board' });
    }

    // Any board member can create tasks. If assigning, assignee must belong to the board.
    if (assignee && !board.members.some((m) => m.toString() === assignee) && board.owner.toString() !== assignee) {
      return res.status(400).json({ message: 'Assignee must be a member of this board' });
    }

    // Sanitise labels
    const cleanLabels = Array.isArray(labels)
      ? labels.map((l) => String(l).trim()).filter(Boolean).slice(0, 5)
      : [];

    const newTask = new Task({
      title,
      description,
      status: 'todo',
      priority: priority || 'medium',
      assignee: assignee || null,
      dueDate: dueDate || null,
      progress: 0,
      board: boardId,
      createdBy: req.userId,
      labels: cleanLabels
    });

    logActivity(newTask, req.userId, 'created', '', '', title);
    await newTask.save();
    const populated = await populateTask(Task.findById(newTask._id));

    const io = req.app.get('io');
    io.to(boardId).emit('taskCreated', populated);

    // Notify assignee
    if (assignee && assignee !== req.userId) {
      await pushNotification(io, {
        recipient: assignee,
        type: 'task_assigned',
        task: newTask._id,
        board: boardId,
        message: `You were assigned a new task: "${title}"`
      });
    }

    res.status(201).json({ message: 'Task created successfully', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all tasks for a specific board (with optional search/filter via query params)
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
    const isAssignee = task.assignee && task.assignee.toString() === req.userId;

    if (!leader && !isAssignee && task.assignee) {
      return res.status(403).json({ message: 'You can only work on tasks assigned to you or unassigned tasks' });
    }

    const attemptedLeaderFields = LEADER_ONLY_FIELDS.filter((f) => req.body[f] !== undefined);
    if (!leader && attemptedLeaderFields.length > 0) {
      return res.status(403).json({
        message: 'Only the board leader can change task deadline, priority, assignee, labels or details'
      });
    }

    const { title, description, priority, assignee: newAssignee, dueDate, progress, progressNote, labels, status } = req.body;

    if (leader) {
      if (newAssignee !== undefined && newAssignee !== null &&
        !board.members.some((m) => m.toString() === newAssignee) && board.owner.toString() !== newAssignee) {
        return res.status(400).json({ message: 'Assignee must be a member of this board' });
      }

      if (title !== undefined && title !== task.title) {
        logActivity(task, req.userId, 'updated', 'title', task.title, title);
        task.title = title;
      }
      if (description !== undefined && description !== task.description) {
        logActivity(task, req.userId, 'updated', 'description', '', '(updated)');
        task.description = description;
      }
      if (priority !== undefined && priority !== task.priority) {
        logActivity(task, req.userId, 'updated', 'priority', task.priority, priority);
        task.priority = priority;
      }
      if (newAssignee !== undefined) {
        const oldAssignee = task.assignee ? task.assignee.toString() : '';
        const newA = newAssignee || null;
        if (newA !== task.assignee?.toString()) {
          logActivity(task, req.userId, 'updated', 'assignee', oldAssignee, newA || 'none');
        }
        task.assignee = newA;

        // Notify new assignee
        if (newA && newA !== req.userId && newA !== oldAssignee) {
          const io = req.app.get('io');
          await pushNotification(io, {
            recipient: newA,
            type: 'task_assigned',
            task: task._id,
            board: task.board,
            message: `You were assigned to task: "${task.title}"`
          });
        }
      }
      if (dueDate !== undefined) {
        logActivity(task, req.userId, 'updated', 'dueDate', task.dueDate ? String(task.dueDate).slice(0,10) : 'none', dueDate || 'none');
        task.dueDate = dueDate || null;
      }
      if (labels !== undefined) {
        const cleanLabels = Array.isArray(labels)
          ? labels.map((l) => String(l).trim()).filter(Boolean).slice(0, 5)
          : [];
        task.labels = cleanLabels;
        logActivity(task, req.userId, 'updated', 'labels', '', cleanLabels.join(', '));
      }
    }

    // Handle direct status change (e.g. drag & drop, quick-check, or column selection)
    if (status !== undefined && ['todo', 'in-progress', 'done'].includes(status)) {
      const oldStatus = task.status;
      task.status = status;
      if (status === 'done') {
        task.progress = 100;
      } else if (status === 'in-progress') {
        task.progress = (task.progress >= 50 && task.progress < 100) ? task.progress : 50;
      } else if (status === 'todo') {
        task.progress = 0;
      }
      if (oldStatus !== status) {
        logActivity(task, req.userId, 'updated', 'status', oldStatus, status);
        logActivity(task, req.userId, 'updated', 'progress', String(task.progress) + '%', task.progress + '%');
      }
    } else if (progress !== undefined) {
      const clamped = Math.max(0, Math.min(100, Math.round(Number(progress))));
      if (clamped !== task.progress) {
        logActivity(task, req.userId, 'updated', 'progress', String(task.progress) + '%', clamped + '%');
      }
      task.progress = clamped;
      task.status = deriveStatus(clamped);
    }

    if (progressNote !== undefined) {
      task.progressNote = progressNote;
    }

    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', populated);

    res.status(200).json({ message: 'Task updated successfully', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a task — leader (board owner) only.
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

    const taskDir = path.join(UPLOAD_ROOT, taskId);
    if (fs.existsSync(taskDir)) {
      fs.rmSync(taskDir, { recursive: true, force: true });
    }

    await task.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.to(boardId).emit('taskDeleted', { taskId });
    }

    res.status(200).json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Upload work-related attachments for a task.
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
    const isAssignee = task.assignee && task.assignee.toString() === req.userId;
    if (!leader && !isAssignee) {
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

    logActivity(task, req.userId, 'attached', 'attachments', '', saved.map(s => s.originalName).join(', '));
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

// Download/view a task attachment
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

// Delete an attachment
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

// Add a comment — now open to all board members (leader + assignee + any member)
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

    // Any board member can comment
    task.comments.push({ author: req.userId, text: text.trim(), createdAt: new Date() });
    logActivity(task, req.userId, 'commented', '', '', text.trim().slice(0, 80));
    await task.save();
    const populated = await populateTask(Task.findById(task._id));

    const io = req.app.get('io');
    io.to(task.board.toString()).emit('taskUpdated', populated);

    // Notify assignee (if the commenter is NOT the assignee)
    const leader = isBoardLeader(board, req.userId);
    const assigneeId = task.assignee ? task.assignee.toString() : null;
    if (assigneeId && assigneeId !== req.userId) {
      await pushNotification(io, {
        recipient: assigneeId,
        type: 'new_comment',
        task: task._id,
        board: task.board,
        message: `New comment on your task: "${task.title}"`
      });
    }
    // Also notify the leader if the commenter is not the leader
    const ownerId = board.owner.toString();
    if (!leader && ownerId !== req.userId) {
      await pushNotification(io, {
        recipient: ownerId,
        type: 'new_comment',
        task: task._id,
        board: task.board,
        message: `New comment on task: "${task.title}"`
      });
    }

    res.status(201).json({ message: 'Comment added', task: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle reaction — leader only
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
