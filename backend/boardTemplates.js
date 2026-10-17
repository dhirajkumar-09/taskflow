// Pre-defined board templates: each template is a list of task stubs
// that get created automatically when a board is initialised from a template.
// `assignee` is left null — the leader assigns after creation.

const BOARD_TEMPLATES = {
  sprint: {
    label: 'Sprint Board',
    description: 'Agile sprint for 2-week delivery cycles',
    tasks: [
      { title: 'Sprint planning meeting', description: 'Define sprint goals and assign tasks', priority: 'high' },
      { title: 'Set up project environment', description: 'Repo, CI/CD, local dev setup', priority: 'high' },
      { title: 'Design wireframes / mockups', description: 'UI screens for this sprint', priority: 'medium' },
      { title: 'Backend API development', description: 'Core endpoints for sprint features', priority: 'high' },
      { title: 'Frontend implementation', description: 'Connect UI to API', priority: 'medium' },
      { title: 'Write unit tests', description: 'Cover new features with tests', priority: 'medium' },
      { title: 'Code review & QA', description: 'Peer review and manual testing', priority: 'medium' },
      { title: 'Deploy to staging', description: 'Push to staging environment', priority: 'low' },
      { title: 'Sprint retrospective', description: 'What went well, what to improve', priority: 'low' }
    ]
  },
  bugTracker: {
    label: 'Bug Tracker',
    description: 'Track, triage and fix bugs systematically',
    tasks: [
      { title: 'Reproduce reported bug #1', description: 'Steps to reproduce and confirm', priority: 'high' },
      { title: 'Identify root cause', description: 'Investigate logs and code', priority: 'high' },
      { title: 'Fix critical crash on login', description: 'App crashes when email has special chars', priority: 'high' },
      { title: 'Fix UI alignment issue on mobile', description: 'Navbar overlaps content on small screens', priority: 'medium' },
      { title: 'Regression testing', description: 'Test all previously fixed bugs', priority: 'medium' },
      { title: 'Update error handling', description: 'Improve user-facing error messages', priority: 'low' },
      { title: 'Write bug report documentation', description: 'Document fixes for future reference', priority: 'low' }
    ]
  },
  contentCalendar: {
    label: 'Content Calendar',
    description: 'Plan and publish content consistently',
    tasks: [
      { title: 'Content strategy brainstorm', description: 'Topics and angles for the month', priority: 'high' },
      { title: 'Write blog post draft', description: 'First draft of this week article', priority: 'high' },
      { title: 'Design social media graphics', description: 'Instagram, LinkedIn, Twitter assets', priority: 'medium' },
      { title: 'Schedule social posts', description: 'Buffer / Hootsuite scheduling', priority: 'medium' },
      { title: 'Record video/reel', description: 'Short-form video content', priority: 'medium' },
      { title: 'Edit and review content', description: 'Proofread and brand check', priority: 'medium' },
      { title: 'Publish blog and newsletter', description: 'Push live and send to email list', priority: 'high' },
      { title: 'Analyse content performance', description: 'Views, clicks, engagement this month', priority: 'low' }
    ]
  },
  projectRoadmap: {
    label: 'Project Roadmap',
    description: 'High-level milestones for a product launch',
    tasks: [
      { title: 'Define project scope and requirements', description: 'PRD, user stories, acceptance criteria', priority: 'high' },
      { title: 'Stakeholder kickoff meeting', description: 'Align on goals and timeline', priority: 'high' },
      { title: 'Architecture & tech stack decision', description: 'Finalise backend and frontend approach', priority: 'high' },
      { title: 'MVP feature development', description: 'Core features only, ship fast', priority: 'high' },
      { title: 'Alpha testing with internal team', description: 'Dog-food the product internally', priority: 'medium' },
      { title: 'Beta launch to limited users', description: 'Invite-only early access', priority: 'medium' },
      { title: 'Collect and prioritise feedback', description: 'User interviews, bug reports', priority: 'medium' },
      { title: 'Performance optimisation', description: 'Lighthouse, DB indexes, caching', priority: 'medium' },
      { title: 'Public launch', description: 'Marketing push, press release', priority: 'high' },
      { title: 'Post-launch monitoring', description: 'Error tracking, uptime checks', priority: 'low' }
    ]
  }
};

module.exports = BOARD_TEMPLATES;
