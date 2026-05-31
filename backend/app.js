import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/socket/index.js';
import authRoutes from './src/routes/auth.routes.js';
import roomRoutes from './src/routes/room.routes.js';
import strokeRoutes from './src/routes/stroke.routes.js';
import snapshotRoutes from './src/routes/snapshot.routes.js';
import { errorHandler } from './src/middleware/error.middleware.js';

dotenv.config();

const requiredEnv = ['MONGO_URI', 'REDIS_URL', 'JWT_SECRET', 'CLIENT_URL'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const PORT = process.env.PORT || 5000;
const normalizeOrigin = (origin) => origin?.trim().replace(/\/$/, '');
const clientOrigins = process.env.CLIENT_URL
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

const isAllowedOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);

  return (
    !normalizedOrigin ||
    clientOrigins.includes(normalizedOrigin) ||
    /^https:\/\/collab-canvas-[a-z0-9-]+\.vercel\.app$/i.test(normalizedOrigin)
  );
};

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/rooms',     roomRoutes);
app.use('/api/strokes',   strokeRoutes);
app.use('/api/snapshots', snapshotRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

const startServer = async () => {
  await connectDB();
  await initSocket(httpServer, isAllowedOrigin);
  httpServer.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
};

startServer().catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
