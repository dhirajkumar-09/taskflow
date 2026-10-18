const Board = require('../models/Board');
const User = require('../models/User');
const Task = require('../models/Task');
const BOARD_TEMPLATES = require('../boardTemplates');


const populateBoard = (query) =>
  query
    .populate('owner', 'name email')
    .populate('members', 'name email');

// Create a new board
const createBoard = async (req, res) => {
  try {
    const { name, template } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Board name is required' });
    }

    const newBoard = new Board({
      name,
      owner: req.userId,
      members: [req.userId]
    });

    await newBoard.save();
    const board = await populateBoard(Board.findById(newBoard._id));


    res.status(201).json({ message: 'Board created successfully', board });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Get all boards the logged-in user owns or is a member of
const getBoards = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.userId }, { members: req.userId }]
    })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ updatedAt: -1 });

    const boardIds = boards.map((b) => b._id);

    // Aggregate task totals + done counts per board in a single query
    const taskStats = await Task.aggregate([
      { $match: { board: { $in: boardIds } } },
      {
        $group: {
          _id: '$board',
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } }
        }
      }
    ]);

    const statsByBoard = {};
    taskStats.forEach((s) => { statsByBoard[s._id.toString()] = s; });

    const enriched = boards.map((b) => {
      const stats = statsByBoard[b._id.toString()] || { total: 0, done: 0 };
      return {
        ...b.toObject(),
        taskCount: stats.total,
        doneCount: stats.done,
        isFavorite: b.favorites.some((f) => f.toString() === req.userId)
      };
    });

    res.status(200).json(enriched);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle favorite/pin status of a board for the logged-in user
const toggleFavorite = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isMember = board.members.some((m) => m.toString() === req.userId) ||
      board.owner.toString() === req.userId;
    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to favorite this board' });
    }

    const alreadyFavorite = board.favorites.some((f) => f.toString() === req.userId);
    if (alreadyFavorite) {
      board.favorites = board.favorites.filter((f) => f.toString() !== req.userId);
    } else {
      board.favorites.push(req.userId);
    }

    await board.save();
    res.status(200).json({ isFavorite: !alreadyFavorite });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Dashboard summary stats: total boards, total tasks, and a status breakdown
// across every board the logged-in user owns or is a member of
const getStats = async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [{ owner: req.userId }, { members: req.userId }]
    }).select('_id');

    const boardIds = boards.map((b) => b._id);

    const taskStats = await Task.aggregate([
      { $match: { board: { $in: boardIds } } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const byStatus = { todo: 0, 'in-progress': 0, done: 0 };
    taskStats.forEach((s) => { byStatus[s._id] = s.count; });

    const totalTasks = byStatus.todo + byStatus['in-progress'] + byStatus.done;
    const completionRate = totalTasks === 0 ? 0 : Math.round((byStatus.done / totalTasks) * 100);

    res.status(200).json({
      totalBoards: boardIds.length,
      totalTasks,
      todo: byStatus.todo,
      inProgress: byStatus['in-progress'],
      done: byStatus.done,
      completionRate
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a single board (with members populated) — owner or member only
const getBoardById = async (req, res) => {
  try {
    const board = await populateBoard(Board.findById(req.params.id));

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const isMember = board.members.some((m) => m._id.toString() === req.userId) ||
      board.owner._id.toString() === req.userId;

    if (!isMember) {
      return res.status(403).json({ message: 'Not authorized to view this board' });
    }

    res.status(200).json(board);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a board
const updateBoard = async (req, res) => {
  try {
    const { name } = req.body;
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to update this board' });
    }

    board.name = name || board.name;
    await board.save();
    const populated = await populateBoard(Board.findById(board._id));

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('boardUpdated', populated);

    res.status(200).json({ message: 'Board updated successfully', board: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a board
const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    if (board.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this board' });
    }

    const boardId = board._id.toString();

    // Delete all tasks associated with this board
    await Task.deleteMany({ board: board._id });
    await board.deleteOne();

    const io = req.app.get('io');
    if (io) {
      io.to(boardId).emit('boardDeleted', { boardId });
    }

    res.status(200).json({ message: 'Board deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Remove a member from a board — owner only, cannot remove the owner
const removeMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board.owner.toString() !== req.userId) {
      return res.status(403).json({ message: 'Only the board owner can remove members' });
    }
    if (board.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'The board owner cannot be removed' });
    }

    board.members = board.members.filter((m) => m.toString() !== req.params.userId);
    await board.save();
    const populated = await populateBoard(Board.findById(board._id));

    const io = req.app.get('io');
    io.to(board._id.toString()).emit('memberRemoved', populated);

    res.status(200).json({ message: 'Member removed successfully', board: populated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { createBoard, getBoards, getBoardById, updateBoard, deleteBoard, removeMember, toggleFavorite, getStats, getBoardAnalytics, getBoardTemplates };

// Board-level analytics — member performance + daily task completions (last 14 days)
async function getBoardAnalytics(req, res) {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: 'Board not found' });

    const isMember = board.members.some((m) => m.toString() === req.userId) ||
      board.owner.toString() === req.userId;
    if (!isMember) return res.status(403).json({ message: 'Not authorized' });

    const tasks = await Task.find({ board: req.params.id })
      .populate('assignee', 'name email');

    // Member performance
    const memberMap = {};
    for (const t of tasks) {
      const key = t.assignee ? t.assignee._id.toString() : '__unassigned__';
      const name = t.assignee ? t.assignee.name : 'Unassigned';
      if (!memberMap[key]) {
        memberMap[key] = { name, assigned: 0, done: 0, inProgress: 0, todo: 0 };
      }
      memberMap[key].assigned++;
      if (t.status === 'done') memberMap[key].done++;
      else if (t.status === 'in-progress') memberMap[key].inProgress++;
      else memberMap[key].todo++;
    }

    // Daily completions for last 14 days (based on updatedAt of done tasks)
    const now = new Date();
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 13);
    cutoff.setHours(0, 0, 0, 0);

    for (const t of tasks) {
      if (t.status === 'done' && t.updatedAt >= cutoff) {
        const key = t.updatedAt.toISOString().slice(0, 10);
        const day = days.find((d) => d.date === key);
        if (day) day.count++;
      }
    }

    // Priority breakdown
    const priorityBreakdown = { low: 0, medium: 0, high: 0 };
    for (const t of tasks) {
      priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
    }

    res.status(200).json({
      memberPerformance: Object.values(memberMap),
      dailyCompletions: days,
      priorityBreakdown,
      totals: {
        total: tasks.length,
        done: tasks.filter((t) => t.status === 'done').length,
        inProgress: tasks.filter((t) => t.status === 'in-progress').length,
        todo: tasks.filter((t) => t.status === 'todo').length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Return list of available templates for the frontend picker
function getBoardTemplates(req, res) {
  const list = Object.entries(BOARD_TEMPLATES).map(([key, val]) => ({
    key,
    label: val.label,
    description: val.description,
    taskCount: val.tasks.length
  }));
  res.status(200).json(list);
}