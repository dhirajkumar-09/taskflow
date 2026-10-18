import { useEffect, useRef, useState } from 'react';
import { authFetch } from '../utils/api';
import { socket } from '../utils/socket';

function InvitationsBell({ onAccepted }) {
  const [invitations, setInvitations] = useState([]);
  const [open, setOpen] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const wrapperRef = useRef(null);

  const fetchInvitations = async () => {
    try {
      const res = await authFetch('/api/invitations');
      if (!res.ok) return;
      const data = await res.json();
      setInvitations(data);
    } catch (err) {
      // Non-critical — bell just stays empty if this fails
    }
  };

  useEffect(() => {
    fetchInvitations();

    const handleReceived = (invitation) => {
      setInvitations((prev) => [invitation, ...prev]);
    };
    socket.on('invitationReceived', handleReceived);

    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.off('invitationReceived', handleReceived);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const respond = async (invitationId, action) => {
    setRespondingId(invitationId);
    try {
      const res = await authFetch(`/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to respond');

      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));
      if (action === 'accept' && onAccepted) onAccepted();
    } catch (err) {
      alert(err.message || 'Something went wrong');
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Board Invitations (Team Collab)"
        aria-label="Board Invitations"
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-105"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: invitations.length > 0 ? '#f59e0b' : 'var(--text)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        {invitations.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
            style={{ background: '#f59e0b' }}
          >
            {invitations.length > 9 ? '9+' : invitations.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-2xl shadow-2xl overflow-hidden z-50 fade-in-up"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDuration: '0.15s' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-base">✉️</span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                  Board Invitations
                </h4>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Team requests to collaborate</p>
              </div>
            </div>
            {invitations.length > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                {invitations.length} pending
              </span>
            )}
          </div>

          <div className="p-3 max-h-80 overflow-y-auto">
            {invitations.length === 0 ? (
              <div className="py-8 text-center px-4">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.1)' }}>
                  <span className="text-lg">✉️</span>
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>No pending invitations</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>When a team member invites you to a board, it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {invitations.map((inv) => (
                  <div
                    key={inv._id}
                    className="rounded-xl p-3.5 transition"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-start gap-2.5 mb-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                      >
                        {inv.invitedBy?.name ? inv.invitedBy.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                          {inv.invitedBy?.name || 'Someone'}
                        </p>
                        <p className="text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                          invited you to join <span className="font-semibold" style={{ color: 'var(--accent)' }}>{inv.board?.name || 'a board'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respond(inv._id, 'accept')}
                        disabled={respondingId === inv._id}
                        className="flex-1 text-xs font-medium py-1.5 rounded-lg text-white transition disabled:opacity-60 hover:opacity-90 shadow-sm"
                        style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
                      >
                        {respondingId === inv._id ? 'Joining...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => respond(inv._id, 'decline')}
                        disabled={respondingId === inv._id}
                        className="flex-1 text-xs font-medium py-1.5 rounded-lg transition disabled:opacity-60 hover:opacity-80"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default InvitationsBell;