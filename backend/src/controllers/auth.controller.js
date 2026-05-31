import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { ok, fail } from '../utils/ApiResponse.js';

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return fail(res, 'All fields required');
    if (await User.findOne({ email })) return fail(res, 'Email already in use');
    const user = await User.create({ username, email, passwordHash: password });
    ok(res, { token: signToken(user._id), user: user.toPublic() }, 201);
  } catch (err) {
    return fail(res, err.message || 'Server error', 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password required');
    const user = await User.findOne({ email });
    if (!user) return fail(res, 'Account does not exist', 404);
    if (!(await user.comparePassword(password))) return fail(res, 'Wrong password', 401);
    await User.findByIdAndUpdate(user._id, { lastActiveAt: new Date() });
    ok(res, { token: signToken(user._id), user: user.toPublic() });
  } catch (err) {
    return fail(res, err.message || 'Server error', 500);
  }
};

export const getMe = async (req, res) => {
  try {
    ok(res, req.user);
  } catch (err) {
    return fail(res, err.message || 'Server error', 500);
  }
};