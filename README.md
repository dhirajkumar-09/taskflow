\# TaskFlow 🚀



A real-time collaborative Kanban board application (like Trello) — built with the MERN stack.



\## Live Demo

Coming soon — deployment in progress.



\## Tech Stack

\- \*\*Frontend:\*\* React, Vite, Tailwind CSS, dnd-kit, Socket.io Client

\- \*\*Backend:\*\* Node.js, Express

\- \*\*Database:\*\* MongoDB (Atlas)

\- \*\*Real-time:\*\* Socket.io

\- \*\*Auth:\*\* JWT, bcrypt



\## Features

\- User signup and login with hashed passwords and JWT sessions

\- Auth middleware protecting all sensitive routes

\- Full board and task management (Create, Read, Update, Delete)

\- Ownership-based access control — users only see and manage their own data

\- Drag-and-drop task management across To Do / In Progress / Done

\- Real-time updates via Socket.io — changes appear instantly for everyone viewing a board

\- Responsive design that works on mobile and desktop

\- Landing page, protected routes, and graceful session-expiry handling



\## API Endpoints



\### Auth

| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/auth/signup` | Register a new user |

| POST | `/api/auth/login` | Login and get a JWT token |



\### Boards (Protected)

| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/boards` | Create a new board |

| GET | `/api/boards` | Get all boards for logged-in user |

| PUT | `/api/boards/:id` | Update a board |

| DELETE | `/api/boards/:id` | Delete a board |



\### Tasks (Protected)

| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/tasks` | Create a new task |

| GET | `/api/tasks/:boardId` | Get all tasks for a board |

| PUT | `/api/tasks/:id` | Update a task |

| DELETE | `/api/tasks/:id` | Delete a task |



\## How to Run Locally



\### Backend

1\. `cd backend`

2\. `npm install`

3\. Create a `.env` file with `PORT`, `MONGO\_URI`, and `JWT\_SECRET`

4\. `npm run dev`



\### Frontend

1\. `cd frontend`

2\. `npm install`

3\. Create a `.env` file with `VITE\_API\_URL=http://localhost:5000`

4\. `npm run dev`



\## Roadmap

\- \[x] Backend APIs with authentication and real-time updates

\- \[x] React frontend with drag-and-drop Kanban board

\- \[ ] Deployment (Vercel + Render)

