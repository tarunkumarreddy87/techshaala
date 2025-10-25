const callSocket = (io) => {
  const activeRooms = new Map(); // Track active call rooms

  io.on('connection', (socket) => {
    console.log('User connected to call server:', socket.id);

    // Join a call room
    socket.on('join-call', ({ courseId, userId, userName, callType }) => {
      const roomId = `call-${courseId}`;
      socket.join(roomId);

      // Track room participants
      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Set());
      }
      activeRooms.get(roomId).add({ socketId: socket.id, userId, userName });

      // Notify others in the room
      socket.to(roomId).emit('user-joined', { 
        userId, 
        userName, 
        callType,
        socketId: socket.id 
      });

      // Send current participants to the new user
      const participants = Array.from(activeRooms.get(roomId));
      socket.emit('existing-participants', participants.filter(p => p.socketId !== socket.id));

      console.log(`User ${userName} joined call room: ${roomId}`);
    });

    // WebRTC Offer
    socket.on('call-offer', ({ courseId, offer, to }) => {
      socket.to(to).emit('call-offer', { 
        offer, 
        from: socket.id 
      });
    });

    // WebRTC Answer
    socket.on('call-answer', ({ courseId, answer, to }) => {
      socket.to(to).emit('call-answer', { 
        answer, 
        from: socket.id 
      });
    });

    // ICE Candidate Exchange
    socket.on('ice-candidate', ({ courseId, candidate, to }) => {
      socket.to(to).emit('ice-candidate', { 
        candidate, 
        from: socket.id 
      });
    });

    // Audio toggle notification
    socket.on('toggle-audio', ({ courseId, userId, enabled }) => {
      const roomId = `call-${courseId}`;
      socket.to(roomId).emit('user-audio-toggle', { 
        userId, 
        enabled,
        socketId: socket.id 
      });
    });

    // Video toggle notification
    socket.on('toggle-video', ({ courseId, userId, enabled }) => {
      const roomId = `call-${courseId}`;
      socket.to(roomId).emit('user-video-toggle', { 
        userId, 
        enabled,
        socketId: socket.id 
      });
    });

    // Screen share started
    socket.on('screen-share-started', ({ courseId, userId }) => {
      const roomId = `call-${courseId}`;
      socket.to(roomId).emit('screen-share-started', { 
        userId,
        socketId: socket.id 
      });
    });

    // Screen share stopped
    socket.on('screen-share-stopped', ({ courseId, userId }) => {
      const roomId = `call-${courseId}`;
      socket.to(roomId).emit('screen-share-stopped', { 
        userId,
        socketId: socket.id 
      });
    });

    // Leave call
    socket.on('leave-call', ({ courseId, userId }) => {
      const roomId = `call-${courseId}`;
      socket.to(roomId).emit('user-left', { 
        userId,
        socketId: socket.id 
      });
      socket.leave(roomId);

      // Clean up room tracking
      if (activeRooms.has(roomId)) {
        const room = activeRooms.get(roomId);
        room.forEach(participant => {
          if (participant.socketId === socket.id) {
            room.delete(participant);
          }
        });
        if (room.size === 0) {
          activeRooms.delete(roomId);
        }
      }

      console.log(`User ${userId} left call room: ${roomId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      // Clean up all rooms this socket was in
      activeRooms.forEach((participants, roomId) => {
        participants.forEach(participant => {
          if (participant.socketId === socket.id) {
            socket.to(roomId).emit('user-left', { 
              userId: participant.userId,
              socketId: socket.id 
            });
            participants.delete(participant);
          }
        });
        if (participants.size === 0) {
          activeRooms.delete(roomId);
        }
      });
      console.log('User disconnected from call server:', socket.id);
    });
  });
};

module.exports = callSocket;