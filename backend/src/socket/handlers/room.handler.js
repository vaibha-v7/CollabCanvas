import Room from '../../models/Room.js';
import Stroke from '../../models/Stroke.js';
import { isRoomMember } from '../../utils/roomAccess.js';

export const registerRoomHandlers = (io, socket) => {

  socket.on('room:join', async ({ roomId }) => {
    try {
      if (!(await isRoomMember(roomId, socket.user._id))) {
        return socket.emit('error', { message: 'Access denied' });
      }

      const room = await Room.findById(roomId)
        .populate('members', 'username avatarUrl displayColor');

      if (!room) return socket.emit('error', { message: 'Room not found' });

      await socket.join(roomId);
      socket.currentRoom = roomId;

      const strokes = await Stroke.find({ roomId, isDeleted: false })
        .populate('userId', 'username displayColor')
        .sort({ createdAt: 1 });

      socket.emit('room:joined', { room, strokes });

      socket.to(roomId).emit('room:user_joined', {
        user: {
          _id:          socket.user._id,
          username:     socket.user.username,
          displayColor: socket.user.displayColor,
          avatarUrl:    socket.user.avatarUrl,
        }
      });

      const socketsInRoom = await io.in(roomId).fetchSockets();
      const activeUsers = socketsInRoom.map(s => ({
        _id:          s.user._id,
        username:     s.user.username,
        displayColor: s.user.displayColor,
        avatarUrl:    s.user.avatarUrl,
        socketId:     s.id,
      }));

      io.to(roomId).emit('room:active_users', { users: activeUsers });

    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('room:leave', async ({ roomId }) => {
    await socket.leave(roomId);
    socket.currentRoom = null;

    socket.to(roomId).emit('room:user_left', {
      userId:   socket.user._id,
      username: socket.user.username,
    });

    const socketsInRoom = await io.in(roomId).fetchSockets();
    const activeUsers = socketsInRoom.map(s => ({
      _id:          s.user._id,
      username:     s.user.username,
      displayColor: s.user.displayColor,
      socketId:     s.id,
    }));

    io.to(roomId).emit('room:active_users', { users: activeUsers });
  });

  socket.on('disconnecting', async () => {
    const rooms = [...socket.rooms].filter(r => r !== socket.id);
    for (const roomId of rooms) {
      socket.to(roomId).emit('room:user_left', {
        userId:   socket.user._id,
        username: socket.user.username,
      });
    }
  });
};
