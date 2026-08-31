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
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.off('invitationReceived', handleReceived);
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  const respond = async (invitationId, action) => {
    setRespondingId(invitationId);

    try {
      const res = await authFetch(
        `/api/invitations/${invitationId}/respond`,
        {
          method: 'POST',
          body: JSON.stringify({ action })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || 'Failed to respond'
        );
      }

      setInvitations((prev) =>
        prev.filter((inv) => inv._id !== invitationId)
      );

      if (action === 'accept' && onAccepted) {
        onAccepted();
      }

    } catch (err) {
      alert(err.message || 'Something went wrong');

    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div
      className="relative"
      ref={wrapperRef}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        title="Invitations"
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)'
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 2a6 6 0 00-6 6v3.2c0 .5-.2 1-.5 1.4L4 15h16l-1.5-2.4c-.3-.4-.5-.9-.5-1.4V8a6 6 0 00-6-6zM9 19a3 3 0 006 0"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {invitations.length > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{
              background: 'var(--danger)'
            }}
          >
            {invitations.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 rounded-2xl p-3 z-30 fade-in-up"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            animationDuration: '0.15s'
          }}
        >
          <p
            className="text-xs font-semibold px-1 mb-2"
            style={{
              color: 'var(--text-muted)'
            }}
          >
            Board invitations
          </p>

          {invitations.length === 0 && (
            <p
              className="text-sm px-1 py-3"
              style={{
                color: 'var(--text-muted)'
              }}
            >
              No pending invitations right now.
            </p>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {invitations.map((inv) => (
              <div
                key={inv._id}
                className="rounded-xl p-3"
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)'
                }}
              >
                <p
                  className="text-sm mb-2"
                  style={{
                    color: 'var(--text)'
                  }}
                >
                  <span className="font-semibold">
                    {inv.invitedBy?.name || 'Someone'}
                  </span>{' '}
                  invited you to{' '}
                  <span className="font-semibold">
                    {inv.board?.name || 'a board'}
                  </span>
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      respond(inv._id, 'accept')
                    }
                    disabled={
                      respondingId === inv._id
                    }
                    className="flex-1 text-xs font-medium py-1.5 rounded-lg text-white transition disabled:opacity-60"
                    style={{
                      background:
                        'linear-gradient(135deg, var(--accent), var(--accent-2))'
                    }}
                  >
                    Accept
                  </button>

                  <button
                    onClick={() =>
                      respond(inv._id, 'decline')
                    }
                    disabled={
                      respondingId === inv._id
                    }
                    className="flex-1 text-xs font-medium py-1.5 rounded-lg transition disabled:opacity-60"
                    style={{
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)'
                    }}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default InvitationsBell;