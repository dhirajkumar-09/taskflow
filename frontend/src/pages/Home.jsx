import { Link } from 'react-router-dom';

const FEATURES = [
  {
    title: 'Real-time sync',
    desc: 'Every change appears instantly for everyone on the board, no refresh needed.',
    icon: (
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke="var(--accent-2)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
    )
  },
  {
    title: 'Drag and drop',
    desc: 'Move tasks between To Do, In Progress and Done with a simple drag.',
    icon: (
      <path d="M9 4v16M15 4v16M4 9h16M4 15h16" stroke="var(--accent-2)" strokeWidth="1.6" strokeLinecap="round"/>
    )
  },
  {
    title: 'Secure by default',
    desc: 'Encrypted passwords, token-based sessions, and strict ownership checks.',
    icon: (
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" stroke="var(--accent-2)" strokeWidth="1.6" strokeLinejoin="round" fill="none"/>
    )
  }
];

function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="grid-pattern absolute inset-x-0 top-0 h-[500px] pointer-events-none"></div>
      <div className="glow-orb floaty absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none" style={{ opacity: 0.25 }}></div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
            <span className="font-display text-white text-sm font-bold">T</span>
          </div>
          <span className="font-display text-white font-semibold text-lg">TaskFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm px-4 py-2 rounded-lg transition" style={{ color: 'var(--text-muted)' }}>
            Log in
          </Link>
          <Link
            to="/signup"
            className="text-sm px-4 py-2 rounded-lg font-medium text-white transition"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
          >
            Sign up
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-3xl mx-auto text-center px-6 pt-20 pb-16 fade-in-up">
        <div
          className="inline-block text-xs px-3 py-1 rounded-full mb-6"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          Built with React, Node.js, MongoDB & Socket.io
        </div>

        <h1 className="font-display text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
          Plan less.<br />
          <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Ship more.
          </span>
        </h1>

        <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: 'var(--text-muted)' }}>
          TaskFlow is a real-time collaborative task board. Create boards, organize work,
          and watch updates appear instantly for everyone on your team.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            to="/signup"
            className="px-7 py-3 rounded-xl font-medium text-white transition"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 24px rgba(99,102,241,0.4)' }}
          >
            Get Started — it's free
          </Link>
          <Link
            to="/login"
            className="px-7 py-3 rounded-xl font-medium transition"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Log In
          </Link>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl p-6"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">{f.icon}</svg>
            </div>
            <h3 className="font-display font-semibold text-white mb-1.5">{f.title}</h3>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;