// client/src/hooks/useChat.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

const useChat = () => {
  const { user, token } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeChats, setActiveChats] = useState([]);
  const [chatInvitations, setChatInvitations] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (token && user && !socketRef.current) {
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketRef.current = newSocket;

      newSocket.on('connect', () => {
        console.log('Connected to chat server');
        setIsConnected(true);
        setSocket(newSocket);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setIsConnected(false);
      });

      newSocket.on('chat_invitation', (data) => {
        setChatInvitations(prev => {
          // Avoid duplicates
          const exists = prev.some(inv => inv.roomId === data.roomId);
          if (!exists) {
            toast.success(`${data.from.name} wants to chat with you`, {
              duration: 5000
            });
            return [...prev, data];
          }
          return prev;
        });
      });

      newSocket.on('active_chats', (chats) => {
        setActiveChats(chats);
      });

      newSocket.on('chat_error', (error) => {
        toast.error(error.message || 'Chat error occurred');
      });

      // Cleanup on unmount
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      };
    }
  }, [token, user]);

  const startChat = useCallback((targetUserId) => {
    if (socket) {
      socket.emit('start_chat', { targetUserId });
    }
  }, [socket]);

  const acceptChatInvitation = useCallback((roomId) => {
    if (socket) {
      socket.emit('accept_chat', { roomId });
      setChatInvitations(prev => prev.filter(inv => inv.roomId !== roomId));
    }
  }, [socket]);

  const rejectChatInvitation = useCallback((roomId) => {
    setChatInvitations(prev => prev.filter(inv => inv.roomId !== roomId));
    // toast.info('Chat invitation declined');
  }, []);

  const sendMessage = useCallback((roomId, message) => {
    if (socket && message.trim()) {
      socket.emit('send_temp_message', {
        roomId,
        message: message.trim(),
        type: 'text'
      });
    }
  }, [socket]);

  const leaveChat = useCallback((roomId) => {
    if (socket) {
      socket.emit('leave_chat', { roomId });
    }
  }, [socket]);

  const startTyping = useCallback((roomId) => {
    if (socket) {
      socket.emit('typing_start', { roomId });
    }
  }, [socket]);

  const stopTyping = useCallback((roomId) => {
    if (socket) {
      socket.emit('typing_stop', { roomId });
    }
  }, [socket]);

  const getActiveChats = useCallback(() => {
    if (socket) {
      socket.emit('get_active_chats');
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    activeChats,
    chatInvitations,
    onlineUsers,
    startChat,
    acceptChatInvitation,
    rejectChatInvitation,
    sendMessage,
    leaveChat,
    startTyping,
    stopTyping,
    getActiveChats
  };
};

export default useChat;