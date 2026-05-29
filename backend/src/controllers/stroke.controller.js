import Stroke from '../models/Stroke.js';
import { ok, fail } from '../utils/ApiResponse.js';
import { isRoomMember } from '../utils/roomAccess.js';

export const getStrokesByRoom = async (req, res) => {
  const { roomId } = req.params;
  if (!(await isRoomMember(roomId, req.user._id))) return fail(res, 'Access denied', 403);

  const strokes = await Stroke.find({ roomId, isDeleted: false })
    .populate('userId', 'username displayColor avatarUrl')
    .sort({ createdAt: 1 });

  ok(res, strokes);
};

export const createStroke = async (req, res) => {
  const { roomId, tool, points, color, width, opacity, shapeType, x, y, w, h, text, fontSize } = req.body;

  if (!roomId || !tool || !color || !width)
    return fail(res, 'roomId, tool, color and width are required');
  if (!(await isRoomMember(roomId, req.user._id))) return fail(res, 'Access denied', 403);

  const stroke = await Stroke.create({
    roomId,
    userId: req.user._id,
    tool,
    points,
    color,
    width,
    opacity: opacity ?? 1,
    shapeType,
    x, y, w, h,
    text, fontSize,
  });

  ok(res, stroke, 201);
};

export const deleteStroke = async (req, res) => {
  const stroke = await Stroke.findById(req.params.id);
  if (!stroke) return fail(res, 'Stroke not found', 404);
  if (!(await isRoomMember(stroke.roomId, req.user._id))) return fail(res, 'Access denied', 403);

  const isOwner = stroke.userId.equals(req.user._id);
  if (!isOwner) return fail(res, 'Not authorized', 403);

  stroke.isDeleted = true;
  stroke.deletedBy = req.user._id;
  await stroke.save();

  ok(res, { message: 'Stroke deleted' });
};

export const clearRoomStrokes = async (req, res) => {
  const { roomId } = req.params;
  if (!(await isRoomMember(roomId, req.user._id))) return fail(res, 'Access denied', 403);

  await Stroke.updateMany(
    { roomId, isDeleted: false },
    { isDeleted: true, deletedBy: req.user._id }
  );

  ok(res, { message: 'Canvas cleared' });
};
