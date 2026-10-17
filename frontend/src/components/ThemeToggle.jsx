import { useState, useEffect } from 'react';
import { getTheme, toggleTheme } from '../utils/theme';

export default function ThemeToggle({ className = '' }) {
  const [theme, setLocalTheme] = useState(getTheme());

  useEffect(() => {
    setLocalTheme(getTheme());
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setLocalTheme(next);
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 ${className}`}
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        color: 'var(--text)'
      }}
      title={theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="rotate-0 transition-transform duration-500">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="-rotate-12 transition-transform duration-500">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
