import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

// Very small heuristic strength meter — feel free to replace with a real library
function getStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Math.min(score, 4); // 0-4
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
const STRENGTH_COLORS = ['var(--border)', 'var(--danger)', '#f59e0b', 'var(--accent)', 'var(--success)'];

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [shakeError, setShakeError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = getStrength(password);

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
      setShakeError(false);
      requestAnimationFrame(() => setShakeError(true));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-3xl font-bold text-white mb-2 stagger-item">Create your account</h1>
      <p className="mb-8 stagger-item delay-1" style={{ color: 'var(--text-muted)' }}>Start organizing your work with TaskFlow</p>

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
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 outline-none transition-all duration-200"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            required
          />
        </div>

        <div className="stagger-item delay-3">
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 outline-none transition-all duration-200"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            required
          />
        </div>

        <div className="stagger-item delay-4">
          <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 outline-none transition-all duration-200"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
            required
          />

          {/* Animated strength meter — only shows once the user starts typing */}
          {password.length > 0 && (
            <div className="mt-2 fade-in-up" style={{ animationDuration: '0.3s' }}>
              <div className="flex gap-1.5 mb-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{
                      background: i < strength ? STRENGTH_COLORS[strength] : 'var(--border)',
                      transform: i < strength ? 'scaleY(1.4)' : 'scaleY(1)'
                    }}
                  ></div>
                ))}
              </div>
              <p className="text-xs" style={{ color: STRENGTH_COLORS[strength] }}>
                {STRENGTH_LABELS[strength]}
              </p>
            </div>
          )}
          {password.length === 0 && (
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>At least 6 characters</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="shine-btn w-full font-medium py-2.5 rounded-lg transition-all duration-200 text-white disabled:opacity-60 mt-2 stagger-item delay-5 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
        >
          {loading && <span className="spinner"></span>}
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p className="text-sm mt-8 text-center stagger-item delay-6" style={{ color: 'var(--text-muted)' }}>
        Already have an account?{' '}
        <Link to="/login" className="font-medium animated-underline" style={{ color: 'var(--accent-2)' }}>
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Signup;