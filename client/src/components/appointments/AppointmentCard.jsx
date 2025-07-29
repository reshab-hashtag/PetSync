import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import useChat from '../../hooks/useChat';
import { useSelector } from 'react-redux';

const AppointmentCard = ({ appointment }) => {
  const { startChat } = useChat();
  const { user } = useSelector((state) => state.auth);


  

  const handleStartChat = () => {
    const targetUserId = user.role === 'pet_owner' 
      ? appointment.staff?._id || appointment.assignedTo?._id
      : appointment.client?._id;
    
    if (targetUserId) {
      startChat(targetUserId, appointment._id);
    }
  };

  const canChat = () => {
    if (user.role === 'pet_owner') {
      return appointment.staff || appointment.assignedTo;
    }
    return appointment.client && (
      appointment.staff?._id === user.id || 
      appointment.assignedTo?._id === user.id
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Appointment details */}
      <div className="mb-4">
        <h3 className="font-semibold">{appointment.service?.name}</h3>
        <p className="text-gray-600">
          {new Date(appointment.date).toLocaleDateString()} at{' '}
          {new Date(appointment.date).toLocaleTimeString()}
        </p>
        {user.role === 'pet_owner' ? (
          <p className="text-sm text-gray-500">
            Staff: {appointment.staff?.profile?.firstName || appointment.assignedTo?.profile?.firstName}
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Client: {appointment.client?.profile?.firstName}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <span className={`px-2 py-1 text-xs rounded-full ${
          appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
          appointment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
          appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {appointment.status.replace('_', ' ')}
        </span>

        {canChat() && (
          <button
            onClick={handleStartChat}
            className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Start chat"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            <span className="text-sm">Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default AppointmentCard;