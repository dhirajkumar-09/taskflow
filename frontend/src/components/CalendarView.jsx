import { useMemo, useState } from 'react';

const STATUS_COLOR = { todo: '#8b93a7', 'in-progress': '#6366f1', done: '#10b981' };
const PRIORITY_COLOR = { low: '#8b93a7', medium: '#f59e0b', high: '#f87171' };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarView({ tasks, onOpen }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const goBack = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const goForward = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  // Build grid — 6 rows of 7 days
  const { cells, firstDay, daysInMonth } = useMemo(() => {
    const first = new Date(year, month, 1);
    const dim = new Date(year, month + 1, 0).getDate();
    return { cells: Array.from({ length: 42 }), firstDay: first.getDay(), daysInMonth: dim };
  }, [year, month]);

  // Map tasks to their due-date day numbers
  const tasksByDay = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const d = new Date(t.dueDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    }
    return map;
  }, [tasks, year, month]);

  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : -1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goBack}
          className="p-2 rounded-lg transition"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h3 className="font-display font-semibold text-lg" style={{ color: 'var(--text)' }}>
          {MONTHS[month]} {year}
        </h3>
        <button
          onClick={goForward}
          className="p-2 rounded-lg transition"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold py-2" style={{ color: 'var(--text-muted)' }}>{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((_, i) => {
          const dayNum = i - firstDay + 1;
          const isValid = dayNum >= 1 && dayNum <= daysInMonth;
          const isToday = dayNum === todayDay;
          const dayTasks = isValid ? (tasksByDay[dayNum] || []) : [];

          return (
            <div
              key={i}
              className="min-h-[80px] rounded-xl p-1.5 transition"
              style={{
                background: isValid ? 'var(--surface)' : 'transparent',
                border: isToday ? '1.5px solid var(--accent)' : isValid ? '1px solid var(--border)' : 'none',
              }}
            >
              {isValid && (
                <>
                  <span
                    className="text-[11px] font-semibold block mb-1 w-5 h-5 flex items-center justify-center rounded-full"
                    style={{
                      color: isToday ? 'white' : 'var(--text-muted)',
                      background: isToday ? 'var(--accent)' : 'transparent'
                    }}
                  >
                    {dayNum}
                  </span>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map((t) => {
                      const isOverdue = new Date(t.dueDate) < today && t.status !== 'done';
                      return (
                        <button
                          key={t._id}
                          onClick={() => onOpen(t)}
                          className="w-full text-left text-[10px] px-1.5 py-1 rounded-lg truncate transition hover:opacity-80"
                          style={{
                            background: isOverdue ? 'rgba(248,113,113,0.15)' : `${STATUS_COLOR[t.status]}18`,
                            color: isOverdue ? 'var(--danger)' : STATUS_COLOR[t.status],
                            border: `1px solid ${isOverdue ? 'rgba(248,113,113,0.3)' : `${STATUS_COLOR[t.status]}33`}`
                          }}
                          title={t.title}
                        >
                          {t.title}
                        </button>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <p className="text-[10px] pl-1" style={{ color: 'var(--text-muted)' }}>+{dayTasks.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 px-1">
        {Object.entries(STATUS_COLOR).map(([s, c]) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: c }}></span>
            <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>{s}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'var(--danger)' }}></span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Overdue</span>
        </div>
      </div>
    </div>
  );
}
