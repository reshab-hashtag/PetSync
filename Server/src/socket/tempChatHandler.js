const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

// In-memory storage for temporary chats
const activeChatRooms = new Map(); // roomId -> { participants: [], messages: [], appointmentId: null }
const userSocketMap = new Map(); // userId -> socketId
const socketUserMap = new Map(); // socketId -> userId

const tempChatHandler = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId)
        .select('_id role profile.firstName profile.lastName userData.business');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.userInfo = {
        id: user._id.toString(),
        name: `${user.profile.firstName} ${user.profile.lastName}`,
        role: user.role
      };

      // Get business ID for staff/admin users
      if (user.userData && user.userData.business && user.userData.business.length > 0) {
        socket.businessId = user.userData.business[0]._id || user.userData.business[0];
      }

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.userId} (${socket.userRole}) connected to temp chat`);

    // Map user to socket
    userSocketMap.set(socket.userId, socket.id);
    socketUserMap.set(socket.id, socket.userId);

    // Join business room for staff/admin
    if (socket.businessId) {
      socket.join(`business_${socket.businessId}`);
    }

    // Generate chat room ID with appointment
    const generateRoomId = (user1Id, user2Id, appointmentId = null) => {
      const baseId = [user1Id, user2Id].sort().join('_');
      return appointmentId ? `${baseId}_apt_${appointmentId}` : baseId;
    };

    // Helper function to check if staff can chat with client
    const canStaffChatWithClient = async (staffId, clientId, appointmentId) => {
      try {
        const query = {
          $or: [
            { "staff.assigned": staffId, client: clientId },
          ],
          status: { $in: ['scheduled', 'in_progress', 'completed'] }
        };

        // If specific appointment provided, check that appointment
        if (appointmentId) {
          query._id = appointmentId;
        }

        const appointment = await Appointment.findOne(query);

        console.log(appointment)
        return { allowed: !!appointment, appointment };
      } catch (error) {
        console.error('Error checking appointment access:', error);
        return { allowed: false, appointment: null };
      }
    };

    // Start a chat session (with appointment context)
    socket.on('start_chat', async (data) => {
      try {
        const { targetUserId, appointmentId } = data;

        
        // Validate target user exists
        const targetUser = await User.findById(targetUserId)
          .select('_id role profile.firstName profile.lastName');
        
        if (!targetUser) {
          return socket.emit('chat_error', { message: 'Target user not found' });
        }

        // Check appointment-based permissions
        let canChat = false;
        let appointment = null;

        if (socket.userRole === 'staff' || socket.userRole === 'business_admin') {
          if (targetUser.role === 'client') {
            const result = await canStaffChatWithClient(socket.userId, targetUserId, appointmentId);
            console.log(result)
            canChat = result.allowed;
            appointment = result.appointment;
          }
        } else if (socket.userRole === 'client') {
          if (targetUser.role === 'staff' || targetUser.role === 'business_admin') {
            const result = await canStaffChatWithClient(targetUserId, socket.userId, appointmentId);
            canChat = result.allowed;
            appointment = result.appointment;
          }
        }

        if (!canChat) {
          return socket.emit('chat_error', { 
            message: 'Chat not allowed. You can only chat with clients/staff you have appointments with.' 
          });
        }

        const roomId = generateRoomId(socket.userId, targetUserId, appointment?._id);
        
        // Create or get existing room
        if (!activeChatRooms.has(roomId)) {
          activeChatRooms.set(roomId, {
            participants: [
              { id: socket.userId, name: socket.userInfo.name, role: socket.userRole },
              { id: targetUserId, name: `${targetUser.profile.firstName} ${targetUser.profile.lastName}`, role: targetUser.role }
            ],
            messages: [],
            appointmentId: appointment?._id || null,
            appointmentDetails: appointment ? {
              id: appointment._id,
              service: appointment.service,
              date: appointment.createdAt,
              status: appointment.status
            } : null,
            createdAt: new Date()
          });
        }

        // Join the chat room
        socket.join(roomId);
        socket.currentChatRoom = roomId;

        // Notify target user if online
        const targetSocketId = userSocketMap.get(targetUserId);
        if (targetSocketId) {
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.join(roomId);
            targetSocket.currentChatRoom = roomId;
            targetSocket.emit('chat_invitation', {
              roomId,
              from: socket.userInfo,
              appointmentDetails: appointment ? {
                id: appointment._id,
                service: appointment.service,
                date: appointment.date
              } : null,
              message: `${socket.userInfo.name} wants to start a chat${appointment ? ` about appointment: ${appointment.service}` : ''}`
            });
          }
        }

        // Send current chat data
        const roomData = activeChatRooms.get(roomId);
        socket.emit('chat_started', {
          roomId,
          participants: roomData.participants,
          messages: roomData.messages,
          appointmentDetails: roomData.appointmentDetails
        });

      } catch (error) {
        console.error('Start chat error:', error);
        socket.emit('chat_error', { message: 'Failed to start chat' });
      }
    });

    // Accept chat invitation
    socket.on('accept_chat', (data) => {
      const { roomId } = data;
      
      if (activeChatRooms.has(roomId)) {
        socket.join(roomId);
        socket.currentChatRoom = roomId;
        
        const roomData = activeChatRooms.get(roomId);
        socket.emit('chat_started', {
          roomId,
          participants: roomData.participants,
          messages: roomData.messages,
          appointmentDetails: roomData.appointmentDetails
        });

        // Notify other participant
        socket.to(roomId).emit('chat_accepted', {
          by: socket.userInfo
        });
      }
    });

    // Send temporary message
    socket.on('send_temp_message', (data) => {
      try {
        const { roomId, message, type = 'text' } = data;

        if (!socket.currentChatRoom || socket.currentChatRoom !== roomId) {
          return socket.emit('message_error', { message: 'Not joined to this chat room' });
        }

        if (!activeChatRooms.has(roomId)) {
          return socket.emit('message_error', { message: 'Chat room not found' });
        }

        const messageData = {
          id: Date.now().toString(),
          from: socket.userInfo,
          message: message.trim(),
          type,
          timestamp: new Date().toISOString()
        };

        // Add to temporary storage
        const roomData = activeChatRooms.get(roomId);
        roomData.messages.push(messageData);

        // Keep only last 50 messages per room
        if (roomData.messages.length > 50) {
          roomData.messages = roomData.messages.slice(-50);
        }

        // Broadcast to room
        io.to(roomId).emit('new_temp_message', messageData);

        // Update appointment with last activity (optional)
        if (roomData.appointmentId) {
          Appointment.findByIdAndUpdate(roomData.appointmentId, {
            lastChatActivity: new Date()
          }).catch(err => console.error('Error updating appointment:', err));
        }

      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', { message: 'Failed to send message' });
      }
    });

    // Typing indicators
    socket.on('typing_start', (data) => {
      const { roomId } = data;
      if (socket.currentChatRoom === roomId) {
        socket.to(roomId).emit('user_typing', {
          user: socket.userInfo,
          typing: true
        });
      }
    });

    socket.on('typing_stop', (data) => {
      const { roomId } = data;
      if (socket.currentChatRoom === roomId) {
        socket.to(roomId).emit('user_typing', {
          user: socket.userInfo,
          typing: false
        });
      }
    });

    // Leave chat
    socket.on('leave_chat', (data) => {
      const { roomId } = data;
      
      if (socket.currentChatRoom === roomId) {
        socket.leave(roomId);
        socket.currentChatRoom = null;
        
        // Notify other participants
        socket.to(roomId).emit('user_left_chat', {
          user: socket.userInfo
        });
      }
    });

    // Get active chats for user (filtered by appointments)
    socket.on('get_active_chats', async () => {
      try {
        const userChats = [];
        
        for (const [roomId, roomData] of activeChatRooms.entries()) {
          const isParticipant = roomData.participants.some(p => p.id === socket.userId);
          if (isParticipant) {
            // Verify user still has appointment access
            if (roomData.appointmentId) {
              const appointment = await Appointment.findById(roomData.appointmentId);
              if (!appointment) {
                // Clean up chat if appointment no longer exists
                activeChatRooms.delete(roomId);
                continue;
              }
            }

            userChats.push({
              roomId,
              participants: roomData.participants.filter(p => p.id !== socket.userId),
              lastMessage: roomData.messages[roomData.messages.length - 1] || null,
              messageCount: roomData.messages.length,
              appointmentDetails: roomData.appointmentDetails
            });
          }
        }

        socket.emit('active_chats', userChats);
      } catch (error) {
        console.error('Error getting active chats:', error);
        socket.emit('active_chats', []);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected from temp chat`);
      
      // Remove from maps
      userSocketMap.delete(socket.userId);
      socketUserMap.delete(socket.id);

      // Notify chat rooms about disconnection
      if (socket.currentChatRoom) {
        socket.to(socket.currentChatRoom).emit('user_disconnected', {
          user: socket.userInfo
        });
      }

      // Clean up empty chat rooms after 5 minutes of inactivity
      setTimeout(() => {
        cleanupInactiveRooms();
      }, 5 * 60 * 1000);
    });
  });

  // Cleanup function for inactive rooms
  const cleanupInactiveRooms = () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    for (const [roomId, roomData] of activeChatRooms.entries()) {
      // Check if any participants are still connected
      const hasActiveParticipants = roomData.participants.some(p => 
        userSocketMap.has(p.id)
      );

      // Remove room if no active participants and created more than 5 minutes ago
      if (!hasActiveParticipants && roomData.createdAt < fiveMinutesAgo) {
        activeChatRooms.delete(roomId);
        console.log(`Cleaned up inactive chat room: ${roomId}`);
      }
    }
  };

  // Periodic cleanup every 10 minutes
  setInterval(cleanupInactiveRooms, 10 * 60 * 1000);
};

module.exports = tempChatHandler;