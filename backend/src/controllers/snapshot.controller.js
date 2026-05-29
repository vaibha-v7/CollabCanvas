import CanvasSnapshot from '../models/CanvasSnapshot.js';
import Room from '../models/Room.js';
import Stroke from '../models/Stroke.js';
import { ok, fail } from '../utils/ApiResponse.js';
import { isRoomMember } from '../utils/roomAccess.js';

export const createSnapshot = async (req, res) => {
  const { roomId, imageUrl, imageFormat = 'png', canvasWidth, canvasHeight, label } = req.body;

  if (!roomId || !imageUrl) return fail(res, 'roomId and imageUrl are required');

  const room = await Room.findById(roomId);
  if (!room) return fail(res, 'Room not found', 404);
  if (!(await isRoomMember(roomId, req.user._id))) return fail(res, 'Access denied', 403);

  const strokeIds = await Stroke.find({ roomId, isDeleted: false }).distinct('_id');

  const snapshot = await CanvasSnapshot.create({
    roomId,
    savedBy: req.user._id,
    imageUrl,
    imageFormat,
    strokeIds,
    strokeCount: strokeIds.length,
    canvasWidth,
    canvasHeight,
    label,
  });

  room.snapshotId = snapshot._id;
  await room.save();

  ok(res, snapshot, 201);
};

export const getSnapshotsByRoom = async (req, res) => {
  if (!(await isRoomMember(req.params.roomId, req.user._id))) return fail(res, 'Access denied', 403);

  const snapshots = await CanvasSnapshot.find({ roomId: req.params.roomId })
    .populate('savedBy', 'username avatarUrl displayColor')
    .sort({ createdAt: -1 });

  ok(res, snapshots);
};

export const getLatestSnapshot = async (req, res) => {
  if (!(await isRoomMember(req.params.roomId, req.user._id))) return fail(res, 'Access denied', 403);

  const snapshot = await CanvasSnapshot.findOne({ roomId: req.params.roomId })
    .sort({ createdAt: -1 });

  if (!snapshot) return fail(res, 'No snapshot found', 404);
  ok(res, snapshot);
};

export const updateSnapshotPdf = async (req, res) => {
  const { pdfUrl } = req.body;
  if (!pdfUrl) return fail(res, 'pdfUrl is required');

  const existing = await CanvasSnapshot.findById(req.params.id).select('roomId');
  if (!existing) return fail(res, 'Snapshot not found', 404);
  if (!(await isRoomMember(existing.roomId, req.user._id))) return fail(res, 'Access denied', 403);

  const snapshot = await CanvasSnapshot.findByIdAndUpdate(
    req.params.id,
    { pdfUrl, exportedAt: new Date() },
    { new: true }
  );

  ok(res, snapshot);
};
