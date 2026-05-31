import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisPub, redisSub, connectRedis } from '../config/redis.js';
import { socketAuth } from './middleware/socket.auth.js';
import { registerRoomHandlers }   from './handlers/room.handler.js';
import { registerCanvasHandlers } from './handlers/canvas.handler.js';
import { registerCursorHandlers } from './handlers/cursor.handler.js';

export const initSocket = async (httpServer, isAllowedOrigin) => {
  await connectRedis();

  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }
  });

  io.adapter(createAdapter(redisPub, redisSub));

  io.use(socketAuth);

  io.on('connection', (socket) => {
    const username = socket.user?.username ?? 'unknown';
    console.log(`Socket connected: ${socket.id} | user: ${username}`);

    registerRoomHandlers(io, socket);
    registerCanvasHandlers(io, socket);
    registerCursorHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
