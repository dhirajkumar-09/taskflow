import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/api';
import { initials } from '../utils/avatar';

const inputStyle = { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' };

function Field({ label, value, onChange, disabled, placeholder }) {
  return (
    <div className="stagger-item">
      <label className="block text-sm mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-lg px-4 py-2.5 outline-none transition-all duration-200 disabled:opacity-60"
        style={inputStyle}
        onFocus={(e) => { if (!disabled) { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'; } }}
        onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [college, setCollege] = useState('');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await authFetch('/api/auth/profile');
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setName(data.name || '');
        setEmail(data.email || '');
        setCollege(data.college || '');
        setDepartment(data.department || '');
      } catch (err) {
        if (err.message !== 'Session expired') setError('Could not load your profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, college, department })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Update failed');

      // Keep localStorage in sync so the dashboard greeting/avatar update too
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, ...data.user }));

      setSuccess('Profile updated successfully');
    } catch (err) {
      if (err.message !== 'Session expired') setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg)' }}>
      <div className="grid-pattern absolute inset-x-0 top-0 h-96 pointer-events-none"></div>

      <nav
        className="sticky top-0 z-20 flex justify-between items-center px-8 py-4 fade-in-up"
        style={{ background: 'rgba(6,8,15,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', animationDuration: '0.4s' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center glow-pulse" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>
            <span className="font-display text-white text-sm font-bold">T</span>
          </div>
          <span className="font-display text-white font-semibold text-lg">TaskFlow</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-sm px-4 py-2 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          ← Back to Dashboard
        </button>
      </nav>

      <div className="relative z-0 max-w-lg mx-auto px-6 py-14 fade-in-up">
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
          >
            {initials(name)}
          </div>
          <div>
            <h2 className="gradient-text font-display text-3xl font-bold">Your Profile</h2>
            <p style={{ color: 'var(--text-muted)' }}>Update your personal details</p>
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
        ) : (
          <>
            {error && (
              <div className="text-sm p-3 rounded-lg mb-5" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}
            {success && (
              <div className="text-sm p-3 rounded-lg mb-5" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid var(--success)', color: 'var(--success)' }}>
                {success}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              <Field label="Email" value={email} disabled placeholder="you@example.com" />
              <Field label="College / Institution" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. IIT Delhi" />
              <Field label="Branch / Department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Computer Science" />

              <button
                type="submit"
                disabled={saving}
                className="shine-btn w-full font-medium py-2.5 rounded-lg transition-all duration-200 text-white disabled:opacity-60 mt-2 flex items-center justify-center gap-2 hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', boxShadow: '0 4px 20px rgba(99,102,241,0.35)' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default Profile;