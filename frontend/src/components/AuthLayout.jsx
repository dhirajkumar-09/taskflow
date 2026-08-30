function AuthLayout({ children }) {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left branding panel */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden items-center justify-center p-16">
        <div className="grid-pattern absolute inset-0"></div>

        {/* Layered animated blobs — tweak size/opacity/position freely */}
        <div className="glow-orb floaty drift w-96 h-96 -top-20 -left-10"></div>
        <div className="glow-orb drift w-72 h-72 bottom-0 right-0" style={{ opacity: 0.3, animationDelay: '-4s' }}></div>
        <div className="glow-orb floaty w-56 h-56 top-1/3 right-10" style={{ opacity: 0.18, animationDelay: '-2s' }}></div>

        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 mb-8 stagger-item">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center glow-pulse"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
            >
              <span className="font-display text-white text-lg font-bold">T</span>
            </div>
            <span className="font-display text-white text-lg font-semibold">TaskFlow</span>
          </div>

          <h1 className="font-display text-4xl font-bold text-white leading-tight mb-4 stagger-item delay-1">
            Plan less.<br />
            <span className="gradient-text-animated">Ship more.</span>
          </h1>
          <p className="text-base leading-relaxed stagger-item delay-2" style={{ color: 'var(--text-muted)' }}>
            A real-time board for teams who'd rather be building than managing spreadsheets.
          </p>

          <div className="mt-10 space-y-4">
            {['Boards that update instantly for everyone', 'Drag, drop, done — no friction', 'Built for small teams that move fast'].map((text, i) => (
              <div key={text} className={`flex items-start gap-3 stagger-item delay-${i + 3}`}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0" style={{ background: 'rgba(99,102,241,0.15)' }}>
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2.5 6.5L4.5 8.5L9.5 3.5" stroke="var(--accent-2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm fade-in-up">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;