import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="text-center">
        <h1 className="font-display text-7xl font-bold mb-4" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          404
        </h1>
        <p className="text-lg text-white mb-2">This page doesn't exist</p>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>
          The board you're looking for may have been moved or deleted.
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-6 py-2.5 rounded-lg font-medium text-white transition"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default NotFound;