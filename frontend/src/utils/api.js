const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const BASE_URL = rawBase.replace(/\/+$/, '');

export async function authFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const res = await fetch(`${BASE_URL}${cleanPath}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${token}`,
      ...options.headers
    }
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  return res;
}