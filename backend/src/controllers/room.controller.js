import Room from '../models/Room.js';
import User from '../models/User.js';
import { generateInviteCode } from '../utils/generateInviteCode.js';
import { ok, fail } from '../utils/ApiResponse.js';

export const createRoom = async (req, res) => {
  const { name, isPublic = true, maxMembers = 10 } = req.body;
  if (!name) return fail(res, 'Room name is required');

  const inviteCode = generateInviteCode();

  const room = await Room.create({
    name,
    inviteCode,
    isPublic,
    maxMembers,
    ownerId: req.user._id,
    members: [req.user._id],
  });

  await User.findByIdAndUpdate(req.user._id, {
    $push: { roomsCreated: room._id, roomsJoined: room._id }
  });

  ok(res, room, 201);
};

export const getMyRooms = async (req, res) => {
  const rooms = await Room.find({
    members: req.user._id,
    isArchived: false
  })
    .populate('ownerId', 'username avatarUrl displayColor')
    .populate('snapshotId', 'imageUrl')
    .sort({ updatedAt: -1 });

  ok(res, rooms);
};

export const getRoomById = async (req, res) => {
  const room = await Room.findById(req.params.id)
    .populate('ownerId', 'username avatarUrl displayColor')
    .populate('members', 'username avatarUrl displayColor')
    .populate('snapshotId', 'imageUrl');

  if (!room) return fail(res, 'Room not found', 404);
  if (room.isArchived) return fail(res, 'Room is archived', 410);

  const isMember = room.members.some(m => m._id.equals(req.user._id));
  if (!isMember) return fail(res, 'Access denied', 403);

  ok(res, room);
};

export const joinRoomByCode = async (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return fail(res, 'Invite code is required');

  const room = await Room.findOne({ inviteCode: inviteCode.toUpperCase(), isArchived: false });
  if (!room) return fail(res, 'Invalid invite code', 404);

  const alreadyMember = room.members.some(m => m.equals(req.user._id));
  if (!alreadyMember) {
    if (room.members.length >= room.maxMembers)
      return fail(res, 'Room is full', 403);

    room.members.push(req.user._id);
    await room.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { roomsJoined: room._id }
    });
  }

  ok(res, room);
};

export const updateRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return fail(res, 'Room not found', 404);
  if (!room.ownerId.equals(req.user._id)) return fail(res, 'Only owner can update', 403);

  const allowed = ['name', 'isPublic', 'maxMembers', 'backgroundColor', 'gridEnabled'];
  allowed.forEach(key => {
    if (req.body[key] !== undefined) room[key] = req.body[key];
  });

  await room.save();
  ok(res, room);
};

export const archiveRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return fail(res, 'Room not found', 404);
  if (!room.ownerId.equals(req.user._id)) return fail(res, 'Only owner can archive', 403);

  room.isArchived = true;
  await room.save();
  ok(res, { message: 'Room archived' });
};

export const leaveRoom = async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return fail(res, 'Room not found', 404);

  if (room.ownerId.equals(req.user._id))
    return fail(res, 'Owner cannot leave — archive the room instead', 400);

  room.members = room.members.filter(m => !m.equals(req.user._id));
  await room.save();

  await User.findByIdAndUpdate(req.user._id, {
    $pull: { roomsJoined: room._id }
  });

  ok(res, { message: 'Left room successfully' });
};
