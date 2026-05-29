export const registerCursorHandlers = (io, socket) => {

  socket.on('cursor:move', ({ roomId, x, y }) => {
    if (socket.currentRoom !== roomId) return;

    socket.to(roomId).emit('cursor:move', {
      userId:       socket.user._id,
      username:     socket.user.username,
      displayColor: socket.user.displayColor,
      x,
      y,
    });
  });

  socket.on('cursor:leave', ({ roomId }) => {
    if (socket.currentRoom !== roomId) return;

    socket.to(roomId).emit('cursor:leave', {
      userId: socket.user._id,
    });
  });
};
