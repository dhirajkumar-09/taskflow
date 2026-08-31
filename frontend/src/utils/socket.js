import { io } from 'socket.io-client';

// One shared socket connection for the whole app.
export const socket = io(import.meta.env.VITE_API_URL);

// Joins the logged-in user's personal notification room so the server
// can push things like invitation requests straight to them, even if
// they're just sitting on the dashboard.
export function registerUser() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (user?._id) {
    socket.emit('registerUser', user._id);
  }
}

// Re-register whenever the socket (re)connects — covers page refreshes
// and reconnects after a dropped connection.
socket.on('connect', registerUser);