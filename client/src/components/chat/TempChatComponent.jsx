import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import {
    ChatBubbleLeftRightIcon,
    XMarkIcon,
    UsersIcon,
    ClockIcon,
    PaperAirplaneIcon,
    ArrowLeftIcon,
    CalendarIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { chatAPI } from '../../services/api';

const TempChatComponent = () => {
    const { user, token } = useSelector((state) => state.auth);
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [chatInvitations, setChatInvitations] = useState([]);
    // const [isTyping, setIsTyping] = useState(false);
    // const [typingUser, setTypingUser] = useState(null);

    const messagesEndRef = useRef(null);
    // const typingTimeoutRef = useRef(null);

    // Helper function to safely render service name
    const getServiceName = (service) => {
        if (!service) return 'Service';
        if (typeof service === 'string') return service;
        if (typeof service === 'object' && service.name) return service.name;
        return 'Service';
    };

    // Helper function to safely render user data
    const safeRender = (value, fallback = '') => {
        if (value === null || value === undefined) return fallback;
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    };

    // Initialize socket connection
    useEffect(() => {
        if (token && user) {
            const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
                auth: { token },
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('✅ Connected to temp chat');
                setIsConnected(true);
                loadAvailableUsers();
            });

            newSocket.on('disconnect', () => {
                console.log('❌ Disconnected from temp chat');
                setIsConnected(false);
            });

            newSocket.on('chat_invitation', (data) => {
                 console.log('📨 Chat invitation received:', data);
                setChatInvitations(prev => [...prev, data]);
                const serviceName = getServiceName(data.appointmentDetails?.service);
                const appointmentInfo = data.appointmentDetails ? ` for ${serviceName}` : '';
                toast.success(`${data.from.name} wants to chat with you${appointmentInfo}`);
            });

            newSocket.on('chat_started', (data) => {
                console.log('💬 Chat started:', data);
                setCurrentChat(data);
                setMessages(data.messages || []);
                setIsOpen(true);
            });

            newSocket.on('chat_accepted', (data) => {
                // console.log('✅ Chat accepted by:', data.by.name);
                toast.success(`${data.by.name} joined the chat`);
            });

            newSocket.on('new_temp_message', (messageData) => {
                 console.log('📩 New message received:', messageData);
                setMessages(prev => [...prev, messageData]);
            });

            // newSocket.on('user_typing', (data) => {
            //     // console.log('⌨️ User typing:', data);
            //     if (data.typing) {
            //         setTypingUser(data.user);
            //     } else {
            //         setTypingUser(null);
            //     }
            // });

            newSocket.on('user_left_chat', (data) => {
                // console.log('👋 User left chat:', data.user.name);
                // toast.info(`${data.user.name} left the chat`);
            });

            newSocket.on('user_disconnected', (data) => {
                // console.log('🔌 User disconnected:', data.user.name);
                // toast.info(`${data.user.name} disconnected`);
            });

            newSocket.on('chat_error', (error) => {
                console.log('❌ Chat error:', error);
                toast.error(error.message || 'Chat error occurred');
            });

            newSocket.on('message_error', (error) => {
                console.log('❌ Message error:', error);
                toast.error(error.message || 'Message error occurred');
            });

            setSocket(newSocket);

            return () => {
                console.log('🔌 Disconnecting socket...');
                newSocket.disconnect();
            };
        }
    }, [currentChat]);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadAvailableUsers = async () => {
        try {
            console.log('🔍 Loading available users...');
            const response = await chatAPI.getAvailableUsers();

            if (response.data.success) {
                setAvailableUsers(response.data.data);
            } else {
                console.log('❌ API returned success: false');
            }
        } catch (error) {
            console.error('❌ Error loading available users:', error);
            toast.error('Failed to load available users');
        }
    };

    const startChat = (targetUserId, appointmentId = null) => {

        if (!socket) {
            console.log('❌ No socket connection');
            toast.error('Not connected to chat server');
            return;
        }

        if (!targetUserId) {
            console.log('❌ No target user ID provided');
            toast.error('Invalid user selected');
            return;
        }

        socket.emit('start_chat', { targetUserId, appointmentId });
    };

    const acceptChatInvitation = (roomId) => {
        if (socket) {
            socket.emit('accept_chat', { roomId });
            setChatInvitations(prev => prev.filter(inv => inv.roomId !== roomId));
        }
    };

    const sendMessage = () => {
        if (!newMessage.trim() || !currentChat || !socket) {
            console.log('❌ Cannot send message:', {
                hasMessage: !!newMessage.trim(),
                hasChat: !!currentChat,
                hasSocket: !!socket
            });
            return;
        }

        // console.log('📤 Sending message:', newMessage);
        socket.emit('send_temp_message', {
            roomId: currentChat.roomId,
            message: newMessage,
            type: 'text'
        });

        setNewMessage('');
        // stopTyping();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };
    const onChange = (e) => {
        e.preventDefault();
        setNewMessage(e.target.value);
    }
    // const startTyping = useCallback(() => {
    //     if (!isTyping && currentChat && socket) {
    //         setIsTyping(true);
    //         socket.emit('typing_start', { roomId: currentChat.roomId });
    //     }

    //     // Reset typing timeout
    //     if (typingTimeoutRef.current) {
    //         clearTimeout(typingTimeoutRef.current);
    //     }

    //     typingTimeoutRef.current = setTimeout(() => {
    //         stopTyping();
    //     }, 3000);
    // }, [isTyping, currentChat, socket]);

    // const stopTyping = useCallback(() => {
    //     if (isTyping && currentChat && socket) {
    //         setIsTyping(false);
    //         socket.emit('typing_stop', { roomId: currentChat.roomId });
    //     }
    //     if (typingTimeoutRef.current) {
    //         clearTimeout(typingTimeoutRef.current);
    //     }
    // }, [isTyping, currentChat, socket]);

    // const leaveChat = () => {
    //     if (currentChat && socket) {
    //         socket.emit('leave_chat', { roomId: currentChat.roomId });
    //         setCurrentChat(null);
    //         setMessages([]);
    //         // setTypingUser(null);
    //     }
    // };

    const backToUserList = () => {
        setCurrentChat(null);
        setMessages([]);
        // setTypingUser(null);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getOtherParticipant = () => {
        if (!currentChat) return null;
        return currentChat.participants.find(p => p.id !== user.id);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return 'text-blue-600 bg-blue-100';
            case 'in_progress': return 'text-yellow-600 bg-yellow-100';
            case 'completed': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    console.log(currentChat)

    // Chat toggle button
    const ChatToggleButton = () => (
        <button
            onClick={() => {
                setIsOpen(!isOpen);
            }}
            className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg transition-all duration-200 z-50 ${isConnected
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
            disabled={!isConnected}
        >
            <ChatBubbleLeftRightIcon className="h-6 w-6" />
            {chatInvitations.length > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {chatInvitations.length}
                </div>
            )}
        </button>
    );

    // Chat window
    const ChatWindow = () => (
        <div className="fixed bottom-10 right-6 w-96 h-96 bg-white rounded-lg shadow-xl border z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b bg-blue-600 text-white rounded-t-lg flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    {currentChat && (
                        <button
                            onClick={backToUserList}
                            className="p-1 hover:bg-blue-700 rounded mr-1"
                        >
                            <ArrowLeftIcon className="h-4 w-4" />
                        </button>
                    )}
                    <UsersIcon className="h-5 w-5" />
                    <div className="flex flex-col">
                        <span className="font-medium">
                            {currentChat ? (getOtherParticipant()?.name || 'Unknown User') : 'Appointment Chat'}
                        </span>
                        {currentChat?.appointmentDetails && (
                            <span className="text-xs text-blue-200">
                                {getServiceName(currentChat.appointmentDetails.service)}
                            </span>
                        )}
                    </div>
                    {/* {isConnected && <div className="w-2 h-2 bg-green-400 rounded-full"></div>} */}
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-blue-700 rounded"
                >
                    <XMarkIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {!currentChat ? (
                    <div className="h-full">
                        {/* Chat invitations */}
                        {chatInvitations.length > 0 && (
                            <div className="p-4 border-b bg-yellow-50">
                                <h4 className="font-medium text-yellow-800 mb-2">Chat Invitations</h4>
                                {chatInvitations.map((invitation, index) => (
                                    <div key={index} className="bg-white rounded p-3 mb-2 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-sm">{invitation.from.name}</span>
                                            <button
                                                onClick={() => acceptChatInvitation(invitation.roomId)}
                                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                            >
                                                Accept
                                            </button>
                                        </div>
                                        {invitation.appointmentDetails && (
                                            <div className="text-xs text-gray-600 flex items-center space-x-2">
                                                <CalendarIcon className="h-3 w-3" />
                                                <span>{getServiceName(invitation.appointmentDetails.service)}</span>
                                                <span>•</span>
                                                <span>{formatDate(invitation.appointmentDetails.date)}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="p-4">
                            {/* Debug info */}
                            {/* <div className="mb-4 p-2 bg-gray-50 rounded text-xs border"> */}
                            {/* <div className="font-medium mb-1">Debug Info:</div> */}
                            {/* <div>Connected: {isConnected ? '✅' : '❌'}</div> */}
                            {/* <div>Available Users: {availableUsers.length}</div> */}
                            {/* <div>Socket ID: {safeRender(socket?.id, 'None')}</div> */}
                            {/* </div> */}

                            {/* Available users */}
                            <div>
                                <h4 className="font-medium text-gray-800 mb-3">
                                    {user?.role === 'client' ? 'Chat with Staff' : 'Chat with Clients'}
                                </h4>

                                {availableUsers.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                                        <p className="text-sm">No available users to chat with</p>
                                        <p className="text-xs">You can only chat with users you have appointments with</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-44 overflow-y-auto">
                                        {availableUsers.map(targetUser => (
                                            <div
                                                key={targetUser.id}
                                                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    startChat(targetUser.id, targetUser.appointmentId);
                                                }}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-medium">
                                                                {targetUser.name ? targetUser.name.split(' ').map(n => n[0]).join('') : 'U'}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium">{safeRender(targetUser.name, 'Unknown User')}</p>
                                                            <p className="text-xs text-gray-500 capitalize">
                                                                {safeRender(targetUser.role?.replace('_', ' '), 'user')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end space-y-1">
                                                        {user?.role === 'client' ? <></> :
                                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(targetUser.appointmentStatus)}`}>
                                                                {safeRender(targetUser.appointmentStatus.replace('_', ' '))}
                                                            </span>
                                                        }

                                                    </div>
                                                </div>
                                                {targetUser.lastAppointment && (
                                                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                                                        <ClockIcon className="h-3 w-3" />
                                                        <span>Last: {formatDate(targetUser.lastAppointment)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col">
                        {/* Appointment info banner */}
                        {currentChat.appointmentDetails && (
                            <div className="bg-blue-50 p-3 border-b">
                                <div className="flex items-center space-x-2 text-sm">
                                    <CalendarIcon className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">
                                        {getServiceName(currentChat.appointmentDetails.service)}
                                    </span>
                                    <span className="text-blue-600">•</span>
                                    <span className="text-blue-600">
                                        {user?.role === 'client'
                                            ?
                                            formatDate(currentChat.appointmentDetails.date)
                                            :
                                            currentChat.appointmentDetails.status.replace('_', ' ') === "completed"
                                                ?
                                                <></>
                                                :
                                                formatDate(currentChat.appointmentDetails.date)
                                        }
                                    </span>
                                    <span className={`ml-auto px-2 py-1 text-xs rounded-full ${getStatusColor(currentChat.appointmentDetails.status)}`}>
                                        {safeRender(currentChat.appointmentDetails.status.replace('_', ' '))}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm">Start your conversation!</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.from.id === user.id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-xs px-3 py-1 rounded-lg ${message.from.id === user.id
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-800'
                                                }`}
                                        >
                                            <p className="text-sm w-fit">{safeRender(message.message)}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs opacity-70">
                                                    {formatTime(message.timestamp)}
                                                </span>
                                                {message.from.id === user.id && (
                                                    <CheckIcon className="h-3 w-3 opacity-70" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {/* Typing indicator */}
                            {/* {typingUser && typingUser.id !== user.id && (
                                <div className="flex justify-start">
                                <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg">
                                    <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                                </div>
                            )} */}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message input */}
                        <div className="p-4 border-t">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => onChange(e)}
                                    // onKeyDown={(e) => {
                                    //     if (e.key === 'Enter') {
                                    //         handleKeyPress(e);
                                    //     }
                                    // }}
                                    placeholder="Type a message..."
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    disabled={!isConnected}
                                    autoFocus
                                />

                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim() || !isConnected}
                                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    <PaperAirplaneIcon className="h-4 w-4" />
                                </button>
                            </div>
                            {/* <div className="flex justify-between items-center mt-2">
                                <button
                                    onClick={leaveChat}
                                    className="text-xs text-red-600 hover:text-red-800"
                                >
                                    Leave chat
                                </button>
                                <span className="text-xs text-gray-500">
                                    {isConnected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div> */}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <>
            {!isOpen && <ChatToggleButton />}
            {isOpen && <ChatWindow />}
        </>
    );
};

export default TempChatComponent;