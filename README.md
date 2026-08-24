# TaskFlow

A real-time collaborative Kanban board application (like Trello) - built with the MERN stack.

## Tech Stack
- **Frontend:** React, Tailwind CSS (coming soon)
- **Backend:** Node.js, Express
- **Database:** MongoDB (Atlas)
- **Real-time:** Socket.io (coming soon)
- **Auth:** JWT, bcrypt

## Features Built So Far (Week 1)
- User signup with hashed passwords (bcrypt)
- User login with JWT token generation
- Auth middleware to protect routes
- Board CRUD APIs (Create, Read, Update, Delete)
- Input validation (express-validator)
- Ownership-based access control (users can only manage their own boards)

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register a new user |
| POST | /api/auth/login | Login and get a JWT token |

### Boards (Protected - requires JWT token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/boards | Create a new board |
| GET | /api/boards | Get all boards for logged-in user |
| PUT | /api/boards/:id | Update a board |
| DELETE | /api/boards/:id | Delete a board |

## How to Run Locally

1. Clone the repo
2. cd backend
3. npm install
4. Create a .env file with PORT, MONGO_URI, and JWT_SECRET
5. npm run dev

## Roadmap
- [ ] Task CRUD APIs
- [ ] Real-time updates with Socket.io
- [ ] React frontend with drag-and-drop
- [ ] Deployment (Vercel + Render)
