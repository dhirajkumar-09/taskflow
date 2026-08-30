# TaskFlow 🚀

A real-time collaborative Kanban board application (like Trello) — built with the MERN stack.

## Live Demo

Coming soon — deployment in progress.

## Features

- 🔐 User signup and login with hashed passwords (bcrypt) and JWT-based sessions
- 🛡️ Auth middleware protecting all sensitive routes
- 🗂️ Full board and task management (Create, Read, Update, Delete)
- 🔒 Ownership-based access control — users only see and manage their own data
- 🖱️ Drag-and-drop task management across To Do / In Progress / Done
- ⚡ Real-time updates via Socket.io — changes appear instantly for everyone viewing a board
- 👥 Team boards — invite members by email, assign tasks, set priority (low/medium/high)
- 📊 Team workload panel showing each member's avatar, assigned tasks, and live progress
- 🙍 Editable profile — update your name, college/institution, and branch/department
- 📱 Responsive design that works on mobile and desktop
- 🏠 Landing page, protected routes, and graceful session-expiry handling

## Tech Stack

**Frontend:** React 19, Vite, Tailwind CSS, dnd-kit, React Router, Socket.io Client
**Backend:** Node.js, Express 5
**Database:** MongoDB (Mongoose)
**Real-time:** Socket.io
**Auth:** JWT, bcryptjs
**Validation:** express-validator

## Project Structure

```
taskflow/
├── backend/
│   ├── controllers/     # Route logic (auth, boards, tasks)
│   ├── middleware/       # JWT auth middleware
│   ├── models/           # Mongoose schemas (User, Board, Task)
│   ├── routes/            # Express route definitions
│   └── server.js         # App entry point + Socket.io setup
└── frontend/
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── pages/         # Route-level pages (Dashboard, BoardView, Profile, etc.)
    │   └── utils/         # API helpers, avatar utils
    └── vite.config.js
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and get a JWT token |
| GET | `/api/auth/profile` | Get the logged-in user's profile (protected) |
| PUT | `/api/auth/profile` | Update name / college / department (protected) |

### Boards (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/boards` | Create a new board |
| GET | `/api/boards` | Get all boards for the logged-in user |
| GET | `/api/boards/:id` | Get board detail with members |
| PUT | `/api/boards/:id` | Update a board |
| DELETE | `/api/boards/:id` | Delete a board |
| POST | `/api/boards/:id/members` | Invite a member by email |
| DELETE | `/api/boards/:id/members/:userId` | Remove a member |
| GET | `/api/boards/stats/summary` | Dashboard stats (total boards/tasks) |

### Tasks (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a new task |
| GET | `/api/tasks/:boardId` | Get all tasks for a board |
| PUT | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or Atlas)

### Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```
Run the server:
```bash
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
```
Create a `.env` file in `frontend/`:
```env
VITE_API_URL=http://localhost:5000
```
Run the dev server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (Vite's default port).

## Roadmap

- [x] Backend APIs with authentication and real-time updates
- [x] React frontend with drag-and-drop Kanban board
- [x] Board members, task assignees, and a per-person workload panel
- [x] Editable user profile (name, college, department)
- [ ] Notifications
- [ ] Due dates for tasks
- [ ] File attachments
- [ ] Deployment (Vercel + Render)

## License

This project is open source and available under the [MIT License](LICENSE).
