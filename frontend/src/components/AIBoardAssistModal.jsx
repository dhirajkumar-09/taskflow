import { useEffect, useState } from 'react';
import { authFetch } from '../utils/api';

function AIBoardAssistModal({ boardId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authFetch(`/api/ai/board-assist/${boardId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI assistant failed');
      setResult(data);
    } catch (err) {
      setError(err.message || 'Could not reach AI assistant');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,8,15,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 scale-in max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', animationDuration: '0.2s' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5 gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2l1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2zM19 14l.8 2.6L22 17.5l-2.2.9L19 21l-.8-2.6-2.2-.9 2.2-.9L19 14z" />
              </svg>
            </div>
            <h2 className="font-display font-semibold text-lg text-white">AI Team Assistant</h2>
          </div>
          <button onClick={onClose} className="shrink-0 p-1 rounded transition" style={{ color: 'var(--text-muted)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 rounded animate-pulse" style={{ background: 'var(--surface-2)' }}></div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="text-sm" style={{ color: 'var(--danger)' }}>
            {error}
            <button
              onClick={fetchSuggestions}
              className="block mt-3 text-xs font-medium px-3 py-1.5 rounded-lg transition"
              style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && result && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Overview</p>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{result.summary}</p>
            </div>

            {result.priorityOrder && result.priorityOrder.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Tackle these next, in order
                </p>
                <ol className="space-y-1.5">
                  {result.priorityOrder.map((title, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 text-sm rounded-lg px-3 py-2"
                      style={{ background: 'var(--surface-2)', color: 'var(--text)' }}
                    >
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
                        style={{ background: 'var(--accent)', color: 'white' }}
                      >
                        {i + 1}
                      </span>
                      {title}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {result.rebalancing && result.rebalancing.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Balance the workload
                </p>
                <ul className="space-y-1.5">
                  {result.rebalancing.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text)' }}>
                      <span style={{ color: 'var(--accent)' }}>•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={fetchSuggestions}
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition"
              style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              ↻ Refresh suggestions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AIBoardAssistModal;