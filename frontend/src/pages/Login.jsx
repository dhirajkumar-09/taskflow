import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-bold text-white mb-2">Welcome back</h1>
      <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Log in to keep your boards moving</p>

      {error && (
        <div className="text-sm p-3 rounded-lg mb-5" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 6h16v12H4z" stroke="var(--text-muted)" strokeWidth="1.5"/>
              <path d="M4 7l8 6 8-6" stroke="var(--text-muted)" strokeWidth="1.5"/>
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg pl-10 pr-4 py-2.5 outline-none transition"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="11" width="14" height="9" rx="1.5" stroke="var(--text-muted)" strokeWidth="1.5"/>
              <path d="M8 11V7a4 4 0 118 0v4" stroke="var(--text-muted)" strokeWidth="1.5"/>
            </svg>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg pl-10 pr-11 py-2.5 outline-none transition"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-medium py-2.5 rounded-lg transition text-white disabled:opacity-60 mt-2"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-sm mt-8 text-center" style={{ color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium" style={{ color: 'var(--accent-2)' }}>
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Login;