// socket/socketHandler.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const socketHandler = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user._id;
      socket.userRole = user.role;
      socket.businessId = user.business;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Join business room for real-time updates
    if (socket.businessId) {
      socket.join(`business_${socket.businessId}`);
    }

    // Handle private messaging
    socket.on('send_message', async (data) => {
      try {
        const { recipientId, text, appointmentId } = data;

        // Create message in database
        const message = new Message({
          from: socket.userId,
          to: recipientId,
          text,
          appointment: appointmentId,
          createdAt: new Date()
        });

        await message.save();

        // Populate sender info
        await message.populate('from', 'profile.firstName profile.lastName');

        // Send to recipient if online
        const recipientSocket = [...io.sockets.sockets.values()]
          .find(s => s.userId.toString() === recipientId);

        if (recipientSocket) {
          recipientSocket.emit('new_message', message);
        }

        // Confirm to sender
        socket.emit('message_sent', { messageId: message._id, status: 'delivered' });

      } catch (error) {
        socket.emit('message_error', { error: error.message });
      }
    });

    // Handle appointment status updates
    socket.on('appointment_update', async (data) => {
      try {
        const { appointmentId, status, update } = data;

        // Broadcast to business room
        socket.to(`business_${socket.businessId}`).emit('appointment_updated', {
          appointmentId,
          status,
          update,
          updatedBy: socket.userId
        });

      } catch (error) {
        socket.emit('update_error', { error: error.message });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
      socket.to(data.recipientId).emit('user_typing', {
        userId: socket.userId,
        typing: true
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(data.recipientId).emit('user_typing', {
        userId: socket.userId,
        typing: false
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });
};

module.exports = socketHandler;