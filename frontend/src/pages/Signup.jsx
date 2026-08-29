import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      navigate('/login');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4" style={{ background: 'var(--accent)' }}>
            <span className="font-display text-white text-xl font-bold">T</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Create your account</h1>
          <p className="mt-2" style={{ color: 'var(--text-muted)' }}>Start organizing your work with TaskFlow</p>
        </div>

        <div className="rounded-2xl p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {error && (
            <div className="text-sm p-3 rounded-lg mb-5" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 outline-none transition"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 outline-none transition"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-2.5 outline-none transition"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                required
              />
              <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>At least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-medium py-2.5 rounded-lg transition text-white disabled:opacity-60"
              style={{ background: 'var(--accent)' }}
              onMouseEnter={(e) => !loading && (e.target.style.background = 'var(--accent-hover)')}
              onMouseLeave={(e) => !loading && (e.target.style.background = 'var(--accent)')}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>
        </div>

        <p className="text-sm mt-6 text-center" style={{ color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" className="font-medium" style={{ color: 'var(--accent)' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;