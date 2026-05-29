import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const { id } = verifyToken(token);
    req.user = await User.findById(id).select('-passwordHash');
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};