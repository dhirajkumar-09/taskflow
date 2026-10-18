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
        className="relative w-9 h-9 rounded-full flex items-center justify-center transition hover:scale-105"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: unread > 0 ? 'var(--accent)' : 'var(--text)'
        }}
        title="Activity & Task Notifications"
        aria-label="Activity Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unread > 0 && (
          <span
            className="absolute -top-1 -right-1 text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shadow-sm"
            style={{ background: 'var(--accent)', color: 'white' }}
          >
            {unread > 9 ? '9+' : unread}
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
              <span className="text-base">🔔</span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text)' }}>
                  Activity & Tasks
                </h4>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Updates, deadlines & assignments</p>
              </div>
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-medium px-2 py-1 rounded-md transition hover:opacity-80"
                style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent)' }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
                  <span className="text-lg">🔔</span>
                </div>
                <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>No activity notifications</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>You're all caught up on your tasks!</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className="flex items-start gap-3 px-4 py-3 transition hover:bg-black/5 dark:hover:bg-white/5"
                  style={{
                    background: n.read ? 'transparent' : 'rgba(99,102,241,0.08)',
                    borderLeft: n.read ? '3px solid transparent' : '3px solid var(--accent)',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <span className="text-base shrink-0 mt-0.5">{ICON[n.type] || '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${n.read ? 'font-normal' : 'font-semibold'}`} style={{ color: 'var(--text)' }}>
                      {n.message}
                    </p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: 'var(--accent)' }} />
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
