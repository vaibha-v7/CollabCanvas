import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { ok, fail } from '../utils/ApiResponse.js';

export const register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return fail(res, 'All fields required');
  if (await User.findOne({ email })) return fail(res, 'Email already in use');
  const user = await User.create({ username, email, passwordHash: password });
  ok(res, { token: signToken(user._id), user: user.toPublic() }, 201);
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) return fail(res, 'Invalid credentials', 401);
  await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });
  ok(res, { token: signToken(user._id), user: user.toPublic() });
};

export const getMe = async (req, res) => ok(res, req.user);