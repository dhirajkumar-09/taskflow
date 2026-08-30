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
  },
  {
    title: 'Built for teams',
    desc: 'Invite members, assign tasks, and see who is working on what at a glance.',
    icon: (
      <path d="M17 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M12 11a4 4 0 100-8 4 4 0 000 8zM23 20v-1a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="var(--accent-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    )
  }
];

// Little animated preview of a board — purely decorative, edit freely
function MiniBoardPreview() {
  const columns = [
    { label: 'To Do', color: '#6366f1', cards: 2 },
    { label: 'In Progress', color: '#a855f7', cards: 1 },
    { label: 'Done', color: '#10b981', cards: 3 },
  ];
  return (
    <div
      className="scale-in rounded-2xl p-5 md:p-6 relative overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: '0.4s', boxShadow: '0 30px 80px -20px rgba(99,102,241,0.35)' }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f87171' }}></div>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#f59e0b' }}></div>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#10b981' }}></div>
        <span className="ml-2 text-xs" style={{ color: 'var(--text-muted)' }}>Product Launch</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {columns.map((col, ci) => (
          <div key={col.label} className="rounded-xl p-2.5" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center gap-1.5 mb-2.5 px-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }}></span>
              <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>{col.label}</span>
            </div>
            <div className="space-y-2">
              {Array.from({ length: col.cards }).map((_, i) => (
                <div
                  key={i}
                  className="stagger-item h-10 rounded-lg"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    animationDelay: `${0.6 + ci * 0.15 + i * 0.1}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Background layer — grid + drifting glow orbs. Add/remove orbs freely. */}
      <div className="grid-pattern absolute inset-x-0 top-0 h-[600px] pointer-events-none"></div>
      <div className="glow-orb floaty drift absolute -top-40 left-1/4 w-[600px] h-[600px] pointer-events-none" style={{ opacity: 0.25 }}></div>
      <div className="glow-orb drift absolute top-24 -right-32 w-96 h-96 pointer-events-none" style={{ opacity: 0.18, animationDelay: '-6s' }}></div>
      <div className="glow-orb floaty absolute top-[520px] left-1/2 -translate-x-1/2 w-72 h-72 pointer-events-none" style={{ opacity: 0.12, animationDelay: '-3s' }}></div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-5 max-w-6xl mx-auto fade-in-up" style={{ animationDuration: '0.4s' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center glow-pulse" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
            <span className="font-display text-white text-sm font-bold">T</span>
          </div>
          <span className="font-display text-white font-semibold text-lg">TaskFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm px-4 py-2 rounded-lg transition-colors animated-underline"
            style={{ color: 'var(--text-muted)' }}
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="shine-btn text-sm px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* ===== Hero ===== */}
      <div className="relative z-10 max-w-3xl mx-auto text-center px-6 pt-16 pb-10">
        <div
          className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full mb-6 stagger-item"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: 'var(--success)' }}></span>
          Built with React, Node.js, MongoDB &amp; Socket.io
        </div>

        <h1 className="font-display text-5xl sm:text-7xl font-bold text-white leading-[1.05] mb-6 stagger-item delay-1">
          Plan less.<br />
          <span className="gradient-text-animated">Ship more.</span>
        </h1>

        <p className="text-lg mb-10 max-w-xl mx-auto stagger-item delay-2" style={{ color: 'var(--text-muted)' }}>
          TaskFlow is a real-time collaborative task board. Create boards, organize work,
          and watch updates appear instantly for everyone on your team.
        </p>

        <div className="flex items-center justify-center gap-4 stagger-item delay-3">
          <Link
            to="/signup"
            className="shine-btn px-7 py-3 rounded-xl font-medium text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 24px rgba(99,102,241,0.4)' }}
          >
            Get Started — it's free
          </Link>
          <Link
            to="/login"
            className="px-7 py-3 rounded-xl font-medium transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            Log In
          </Link>
        </div>
      </div>

      {/* ===== Live mini-preview of a board ===== */}
      <div className="relative z-10 max-w-lg mx-auto px-6 mb-24">
        <MiniBoardPreview />
      </div>

      {/* ===== Feature grid ===== */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-8">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-white text-center mb-2 stagger-item">
          Everything you need, nothing you don't
        </h2>
        <p className="text-center mb-12 stagger-item delay-1" style={{ color: 'var(--text-muted)' }}>
          A focused feature set so your team can start moving on day one.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group rounded-2xl p-6 hover-lift stagger-item relative overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDelay: `${0.15 + i * 0.1}s` }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(99,102,241,0.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div
                className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.25), transparent 70%)' }}
              ></div>
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 relative z-10"
                style={{ background: 'rgba(99,102,241,0.12)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">{f.icon}</svg>
              </div>
              <h3 className="font-display font-semibold text-white mb-1.5 relative z-10">{f.title}</h3>
              <p className="text-sm relative z-10" style={{ color: 'var(--text-muted)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ===== Bottom CTA band ===== */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-16">
        <div
          className="scale-in rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(168,85,247,0.14))', border: '1px solid var(--border)' }}
        >
          <div className="glow-orb floaty absolute -top-24 -left-16 w-64 h-64 pointer-events-none" style={{ opacity: 0.25 }}></div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 relative z-10">
            Ready to organize your team?
          </h2>
          <p className="mb-8 max-w-md mx-auto relative z-10" style={{ color: 'var(--text-muted)' }}>
            Create your first board in under a minute. No credit card required.
          </p>
          <Link
            to="/signup"
            className="shine-btn inline-block px-8 py-3.5 rounded-xl font-medium text-white transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 relative z-10"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 24px rgba(99,102,241,0.45)' }}
          >
            Create your free account
          </Link>
        </div>
      </div>

      {/* Subtle scroll cue — remove this block if you don't want it */}
      <div className="relative z-10 flex justify-center pb-10">
        <div className="bounce-down" style={{ color: 'var(--text-muted)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 4v16M6 14l6 6 6-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Home;
