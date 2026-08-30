import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
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
      // retrigger the shake animation even if the same error fires twice in a row
      setShakeError(false);
      requestAnimationFrame(() => setShakeError(true));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-bold text-white mb-2 stagger-item">Welcome back</h1>
      <p className="mb-8 stagger-item delay-1" style={{ color: 'var(--text-muted)' }}>Log in to keep your boards moving</p>

      {error && (
        <div
          className={`text-sm p-3 rounded-lg mb-5 ${shakeError ? 'shake' : ''}`}
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
          onAnimationEnd={() => setShakeError(false)}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="stagger-item delay-2">
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
              className="w-full rounded-lg pl-10 pr-4 py-2.5 outline-none transition-all duration-200"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              required
            />
          </div>
        </div>

        <div className="stagger-item delay-3">
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
              className="w-full rounded-lg pl-10 pr-11 py-2.5 outline-none transition-all duration-200"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)' }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="shine-btn w-full font-medium py-2.5 rounded-lg transition-all duration-200 text-white disabled:opacity-60 mt-2 stagger-item delay-4 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
        >
          {loading && <span className="spinner"></span>}
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <p className="text-sm mt-8 text-center stagger-item delay-5" style={{ color: 'var(--text-muted)' }}>
        Don't have an account?{' '}
        <Link to="/signup" className="font-medium animated-underline" style={{ color: 'var(--accent-2)' }}>
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Login;