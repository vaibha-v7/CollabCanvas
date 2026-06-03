import User from '../models/User.js';
import { signToken } from '../utils/jwt.js';
import { ok, fail } from '../utils/ApiResponse.js';

export const register = async (req, res) => {
  try {
    const { username, email, password, displayColor } = req.body;
    if (!username || !email || !password) return fail(res, 'All fields required');
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();
    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existingUser) {
      if (existingUser.email === normalizedEmail) return fail(res, 'Email already in use');
      return fail(res, 'Username already in use');
    }
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash: password,
      displayColor,
    });
    ok(res, { token: signToken(user._id), user: user.toPublic() }, 201);
  } catch (err) {
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return fail(res, `${field} already in use`, 409);
    }
    return fail(res, err.message || 'Server error', 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 'Email and password required');
    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
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