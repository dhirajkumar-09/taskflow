const Task = require('../models/Task');
const Board = require('../models/Board');
const { callGeminiJSON } = require('../services/geminiService');

// Returns null if board doesn't exist, false if the user has no access,
// or the populated board document if the user is the owner or a member.
const verifyBoardAccess = async (boardId, userId) => {
  const board = await Board.findById(boardId)
    .populate('members', 'name email')
    .populate('owner', 'name email');
  if (!board) return null;
  const hasAccess = board.owner._id.toString() === userId ||
    board.members.some((m) => m._id.toString() === userId);
  return hasAccess ? board : false;
};

// POST /api/ai/breakdown
// Given a single task's title/description, ask Gemini for a short,
// practical checklist so the assignee can finish it faster.
const breakdownTask = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Task title is required' });
    }

    const prompt = `You are a productivity assistant inside a team task management app called TaskFlow.
A user needs help finishing the following task quickly and correctly.

Task title: "${title}"
Task description: "${description && description.trim() ? description : 'No description provided'}"

Break this task down into a short, practical, step-by-step checklist (4 to 7 steps) the assignee can follow to complete it as fast as possible. Each step must be concise (under 15 words) and actionable. Also give one short overall tip for speeding this up.

Respond ONLY with valid JSON, no markdown fences, no extra commentary, in exactly this shape:
{"steps": ["step 1", "step 2"], "tip": "one short tip"}`;

    const parsed = await callGeminiJSON(prompt);

    res.status(200).json({
      steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 7) : [],
      tip: typeof parsed.tip === 'string' ? parsed.tip : ''
    });
  } catch (error) {
    console.error('AI breakdown error:', error);
    res.status(502).json({ message: 'AI assistant is unavailable right now', error: error.message });
  }
};

// GET /api/ai/board-assist/:boardId
// Looks at every task + member on a board and asks Gemini how the team
// can finish everything faster: what to prioritize next and how to
// rebalance workload across members.
const boardAssist = async (req, res) => {
  try {
    const { boardId } = req.params;

    const board = await verifyBoardAccess(boardId, req.userId);
    if (board === null) {
      return res.status(404).json({ message: 'Board not found' });
    }
    if (board === false) {
      return res.status(403).json({ message: 'Not authorized to access this board' });
    }

    const tasks = await Task.find({ board: boardId }).populate('assignee', 'name email');

    const openTasks = tasks.filter((t) => t.status !== 'done');
    if (tasks.length === 0) {
      return res.status(200).json({
        summary: 'This board has no tasks yet. Add a few tasks to get AI suggestions on priority and workload.',
        priorityOrder: [],
        rebalancing: []
      });
    }

    const people = [board.owner, ...board.members];
    const taskSummaries = tasks.map((t) => ({
      title: t.title,
      status: t.status,
      priority: t.priority,
      assignee: t.assignee ? t.assignee.name : 'Unassigned'
    }));

    const prompt = `You are an AI project assistant for a team Kanban board called "${board.name}" in the TaskFlow app.

Team members: ${people.map((p) => p.name).join(', ')}

Current tasks (JSON, one entry per task):
${JSON.stringify(taskSummaries, null, 2)}

Your goal is to help this team finish all remaining ("todo" and "in-progress") tasks as fast as possible. Consider task priority/status and how evenly work is distributed across members.

Respond ONLY with valid JSON, no markdown fences, no extra commentary, in exactly this shape:
{
  "summary": "2-3 sentence overview of the board's current state and the biggest risk to finishing on time",
  "priorityOrder": ["task title 1", "task title 2"],
  "rebalancing": ["short actionable suggestion 1", "short actionable suggestion 2"]
}
"priorityOrder" must list up to 5 titles taken from the unfinished tasks above, in the order the team should tackle them next.
"rebalancing" must contain up to 4 short, concrete suggestions (reassigning tasks, splitting big ones, pairing people up, etc.) to balance workload and speed things up, naming members by name where useful.`;

    const parsed = await callGeminiJSON(prompt);

    res.status(200).json({
      summary: typeof parsed.summary === 'string' ? parsed.summary : '',
      priorityOrder: Array.isArray(parsed.priorityOrder) ? parsed.priorityOrder.slice(0, 5) : [],
      rebalancing: Array.isArray(parsed.rebalancing) ? parsed.rebalancing.slice(0, 4) : [],
      openTaskCount: openTasks.length
    });
  } catch (error) {
    console.error('AI board assist error:', error);
    res.status(502).json({ message: 'AI assistant is unavailable right now', error: error.message });
  }
};

module.exports = { breakdownTask, boardAssist };