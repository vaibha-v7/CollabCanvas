import { verifyToken } from '../../utils/jwt.js';
import User from '../../models/User.js';

export const socketAuth = async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const { id } = verifyToken(token);
    socket.user = await User.findById(id).select('-passwordHash');
    if (!socket.user) return next(new Error('User not found'));
    next();
  } catch {
    next(new Error('Invalid token'));
  }
};