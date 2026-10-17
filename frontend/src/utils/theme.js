// Theme utility — manages light/dark mode via a class on <html>
// and persists the preference in localStorage.

const STORAGE_KEY = 'tf_theme';

export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || 'dark';
}

export function applyTheme(mode) {
  const root = document.documentElement;
  if (mode === 'light') {
    root.classList.add('light');
  } else {
    root.classList.remove('light');
  }
}

export function setTheme(mode) {
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

// Apply on module load (picks up persisted preference on refresh)
applyTheme(getTheme());
