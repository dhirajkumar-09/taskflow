import { useState } from 'react';

function InviteMemberModal({ onClose, onInvite }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) return;

    setLoading(true);
    setError('');

    try {
      await onInvite(email.trim());
      onClose();

    } catch (err) {
      setError(
        err.message || 'Failed to send invite'
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(6,8,15,0.75)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 fade-in-up"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-semibold text-white text-lg mb-1">
          Invite a teammate
        </h3>

        <p
          className="text-sm mb-5"
          style={{
            color: 'var(--text-muted)'
          }}
        >
          They need an existing TaskFlow account.
          We'll send them a request — they'll join
          once they accept it.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            placeholder="teammate@company.com"
            className="w-full rounded-xl px-4 py-3 outline-none transition mb-3"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor =
                'var(--accent)';

              e.target.style.boxShadow =
                '0 0 0 3px rgba(99,102,241,0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor =
                'var(--border)';

              e.target.style.boxShadow = 'none';
            }}
          />

          {error && (
            <p
              className="text-sm mb-3"
              style={{
                color: 'var(--danger)'
              }}
            >
              {error}
            </p>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-medium transition"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl font-medium text-white transition disabled:opacity-60"
              style={{
                background:
                  'linear-gradient(135deg, var(--accent), var(--accent-2))'
              }}
            >
              {loading
                ? 'Sending...'
                : 'Send invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InviteMemberModal;