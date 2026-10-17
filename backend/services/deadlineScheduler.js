const cron = require('node-cron');
const Task = require('../models/Task');
const { pushNotification } = require('../controllers/notificationController');

/**
 * Deadline Warning Scheduler
 * Runs every day at 9:00 AM server time.
 * Sends a 'deadline_warning' notification to the assignee if their task's
 * due date is today or tomorrow (and the task is not done yet).
 */
const startDeadlineScheduler = (io) => {
  // "0 9 * * *" = every day at 09:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[DeadlineScheduler] Checking upcoming deadlines...');
    try {
      const now = new Date();

      // Window: from start of today to end of tomorrow
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      const endOfTomorrow = new Date(now);
      endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
      endOfTomorrow.setHours(23, 59, 59, 999);

      const upcomingTasks = await Task.find({
        dueDate: { $gte: startOfToday, $lte: endOfTomorrow },
        status: { $ne: 'done' },
        assignee: { $ne: null }
      }).populate('board', 'name');

      console.log(`[DeadlineScheduler] Found ${upcomingTasks.length} task(s) with upcoming deadlines.`);

      for (const task of upcomingTasks) {
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

        let message;
        if (diffDays === 0) {
          message = `⏰ Aaj deadline hai: "${task.title}" — abhi complete karo!`;
        } else if (diffDays === 1) {
          message = `⏰ Kal deadline hai: "${task.title}" — kal tak finish karo!`;
        } else {
          continue; // Should not happen given query, but safety check
        }

        await pushNotification(io, {
          recipient: task.assignee,
          type: 'deadline_warning',
          task: task._id,
          board: task.board ? task.board._id : null,
          message
        });
      }

      console.log('[DeadlineScheduler] Done.');
    } catch (err) {
      console.error('[DeadlineScheduler] Error:', err.message);
    }
  });

  console.log('[DeadlineScheduler] Scheduler started — runs daily at 9:00 AM.');
};

module.exports = { startDeadlineScheduler };
