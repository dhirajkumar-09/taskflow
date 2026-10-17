import { useState, useEffect, useRef } from 'react';
import { authFetch } from '../utils/api';
import { socket } from '../utils/socket';

export default function NotificationsBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unread = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    try {
      const res = await authFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchNotifications();

    const handleNew = (n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 50));
    };
    socket.on('notification', handleNew);
    return () => socket.off('notification', handleNew);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const markAllRead = async () => {
    try {
      await authFetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (_) {}
  };

  const ICON = {
    task_assigned: '📋',
    new_comment: '💬',
    deadline_warning: '⏰',
    task_updated: '✏️',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 text-[10px] font-bold min-w-[17px] h-[17px] flex items-center justify-center rounded-full px-1"
            style={{ background: 'var(--danger)', color: 'white' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-2xl overflow-hidden z-50"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notifications</span>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs transition"
                style={{ color: 'var(--accent)' }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className="flex items-start gap-3 px-4 py-3 transition"
                  style={{
                    background: n.read ? 'transparent' : 'rgba(99,102,241,0.06)',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <span className="text-base shrink-0">{ICON[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug" style={{ color: 'var(--text)' }}>{n.message}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1" style={{ background: 'var(--accent)' }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
