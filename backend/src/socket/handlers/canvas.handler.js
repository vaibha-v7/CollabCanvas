import Stroke from '../../models/Stroke.js';
import { isRoomMember } from '../../utils/roomAccess.js';

export const registerCanvasHandlers = (io, socket) => {

  socket.on('draw:stroke', async (data) => {
    const { roomId, tool, points, color, width, opacity, shapeType, x, y, w, h, text, fontSize } = data;

    try {
      if (!(await isRoomMember(roomId, socket.user._id))) {
        return socket.emit('error', { message: 'Access denied' });
      }

      const stroke = await Stroke.create({
        roomId,
        userId:   socket.user._id,
        tool,
        points,
        color,
        width,
        opacity:  opacity ?? 1,
        shapeType,
        x, y, w, h,
        text, fontSize,
        socketId: socket.id,
      });

      socket.to(roomId).emit('draw:stroke', {
        ...data,
        _id:    stroke._id,
        userId: {
          _id:          socket.user._id,
          username:     socket.user.username,
          displayColor: socket.user.displayColor,
        },
      });

      socket.emit('draw:stroke_saved', { tempId: data.tempId, _id: stroke._id });

    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('draw:stroke_live', (data) => {
    if (socket.currentRoom !== data.roomId) return;

    socket.to(data.roomId).emit('draw:stroke_live', {
      ...data,
      userId:       socket.user._id,
      displayColor: socket.user.displayColor,
    });
  });

  socket.on('canvas:undo', async ({ roomId, strokeId }) => {
    try {
      if (!(await isRoomMember(roomId, socket.user._id))) {
        return socket.emit('error', { message: 'Access denied' });
      }

      await Stroke.findOneAndUpdate({ _id: strokeId, roomId }, {
        isDeleted: true,
        deletedBy: socket.user._id,
      });

      io.to(roomId).emit('canvas:undo', { strokeId });

    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('canvas:redo', async ({ roomId, strokeId }) => {
    try {
      if (!(await isRoomMember(roomId, socket.user._id))) {
        return socket.emit('error', { message: 'Access denied' });
      }

      await Stroke.findOneAndUpdate({ _id: strokeId, roomId }, {
        isDeleted: false,
        deletedBy: null,
      });

      io.to(roomId).emit('canvas:redo', { strokeId });

    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('canvas:stroke_updated', async ({ roomId, strokeId, changes }) => {
    try {
      if (!(await isRoomMember(roomId, socket.user._id))) {
        return socket.emit('error', { message: 'Access denied' });
      }

      await Stroke.findOneAndUpdate({ _id: strokeId, roomId }, changes);

      socket.to(roomId).emit('canvas:stroke_updated', {
        strokeId,
        changes,
      });
    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('canvas:clear', async ({ roomId }) => {
    try {
      if (!(await isRoomMember(roomId, socket.user._id))) {
        return socket.emit('error', { message: 'Access denied' });
      }

      await Stroke.updateMany(
        { roomId, isDeleted: false },
        { isDeleted: true, deletedBy: socket.user._id }
      );

      io.to(roomId).emit('canvas:clear', {
        clearedBy: {
          _id:      socket.user._id,
          username: socket.user.username,
        }
      });

    } catch (err) {
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('tool:change', ({ roomId, tool }) => {
    if (socket.currentRoom !== roomId) return;

    socket.to(roomId).emit('tool:change', {
      userId: socket.user._id,
      tool,
    });
  });
};
