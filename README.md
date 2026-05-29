# CollabCanvas

CollabCanvas is a real-time collaborative whiteboard app for creating shared rooms, drawing together, tracking live cursors, and exporting canvas work as PDFs.

## Features

- Account registration and login with JWT authentication
- Personal cursor colors for clear team presence
- Room lobby with room creation, invite-code joining, and room search
- Real-time canvas drawing with Socket.IO
- Pen, line, rectangle, circle, arrow, select, undo, clear, color, width, and opacity tools
- Active-user and live-cursor updates inside rooms
- Canvas export to PDF
- MongoDB persistence for users, rooms, strokes, and snapshots
- Redis-backed Socket.IO adapter for scalable realtime messaging

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, Konva, Socket.IO Client, Axios
- Backend: Node.js, Express, Socket.IO, MongoDB, Mongoose, Redis, JWT, bcrypt
- Realtime: Socket.IO with Redis adapter

## Project Structure

```text
Collab/
  backend/
    app.js
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      socket/
      utils/
  frontend/
    index.html
    public/
    src/
      api/
      components/
      context/
      hooks/
      pages/
```

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB database
- Redis instance

For local development, MongoDB and Redis can run locally. For production, use managed services such as MongoDB Atlas and a hosted Redis provider.

## Environment Variables

Real `.env` files are intentionally ignored by Git. Use the example files as templates.

### Backend

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/collabcanvas
REDIS_URL=redis://localhost:6379
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Production notes:

- `JWT_SECRET` must be a long random value.
- `CLIENT_URL` must match the deployed frontend origin exactly.
- Multiple allowed frontend origins can be comma-separated.
- Use `rediss://` if your Redis provider requires TLS.

### Frontend

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

Production values should point to the deployed backend:

```env
VITE_API_URL=https://your-backend-domain.com/api
VITE_SOCKET_URL=https://your-backend-domain.com
```

## Local Development

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

The backend health check is:

```text
http://localhost:5000/api/health
```

## Scripts

Backend:

```bash
npm start      # run production server
npm run dev    # run with nodemon
```

Frontend:

```bash
npm run dev      # start Vite dev server
npm run build    # create production build
npm run preview  # preview production build locally
npm run lint     # run ESLint
```

## Deployment Checklist

Before deploying:

- Set all backend environment variables in the backend hosting dashboard.
- Set all frontend `VITE_*` variables in the frontend hosting dashboard before building.
- Use production MongoDB and Redis services.
- Make sure `CLIENT_URL` matches the frontend deployment URL.
- Make sure `VITE_API_URL` ends with `/api`.
- Make sure `VITE_SOCKET_URL` points to the backend origin without `/api`.
- Do not commit `.env` files.
- Run `npm run lint` and `npm run build` in `frontend`.
- Run `npm audit --audit-level=moderate` in both `frontend` and `backend`.

## Security Notes

- Passwords are hashed with bcrypt before being stored.
- API and socket room actions are protected with JWT authentication.
- Canvas and room realtime events check room membership before mutating data.
- Keep JWT tokens and secrets out of the repository.
- Rotate `JWT_SECRET` if it is ever exposed.

## Suggested Hosting

One simple deployment split:

- Frontend: Vercel, Netlify, or Render Static Site
- Backend: Render, Railway, Fly.io, or another Node.js host
- Database: MongoDB Atlas
- Redis: Upstash, Redis Cloud, Railway Redis, or Render Redis

## Common Issues

### CORS error

Check that backend `CLIENT_URL` exactly matches the frontend URL, including `https://` and no trailing slash unless your host uses one.

### Socket does not connect

Check `VITE_SOCKET_URL`, backend CORS settings, Redis connection, and whether the backend host supports WebSocket upgrades.

### Frontend still calls localhost after deployment

Vite embeds `VITE_*` variables at build time. Update the frontend host environment variables and rebuild.

### Backend starts locally but not in production

Check that `MONGO_URI`, `REDIS_URL`, `JWT_SECRET`, and `CLIENT_URL` are all configured in the backend host.

## License

This project is currently private. Add a license before publishing publicly.
