import Room from '../models/Room.js';

export const getMemberRoom = (roomId, userId) =>
  Room.findOne({
    _id: roomId,
    isArchived: false,
    members: userId,
  });

export const isRoomMember = async (roomId, userId) =>
  Boolean(await getMemberRoom(roomId, userId).select('_id'));
