import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  CheckIcon,
  XMarkIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../common/LoadingSpinner';
import { 
  fetchNotifications, 
  markNotificationAsRead, 
  markAllAsRead, 
  deleteNotification,
  clearAllNotifications 
} from '../../store/slices/notificationSlice';

const NotificationPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, isLoading, unreadCount, error } = useSelector(state => state.notifications);
  const { user } = useSelector(state => state.auth);
  
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  // Check if user can create notifications
  const canCreateNotifications = user?.role === 'super_admin' || user?.role === 'business_admin';

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type, isRead) => {
    const iconClass = `h-6 w-6 ${isRead ? 'text-gray-400' : 'text-blue-600'}`;
    
    switch (type) {
      case 'appointment':
        return <ClockIcon className={iconClass} />;
      case 'payment':
        return <CheckCircleIcon className={iconClass} />;
      case 'system':
        return <InformationCircleIcon className={iconClass} />;
      case 'warning':
        return <ExclamationTriangleIcon className={iconClass} />;
      default:
        return <BellIcon className={iconClass} />;
    }
  };

  // Get notification color based on type
  const getNotificationColor = (type, isRead) => {
    if (isRead) return 'border-gray-200 bg-gray-50';
    
    switch (type) {
      case 'appointment':
        return 'border-blue-200 bg-blue-50';
      case 'payment':
        return 'border-green-200 bg-green-50';
      case 'system':
        return 'border-indigo-200 bg-indigo-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      dispatch(markNotificationAsRead(notification._id));
    }
    
    // Navigate based on notification type
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  // Handle delete notification
  const handleDeleteNotification = (notificationId) => {
    dispatch(deleteNotification(notificationId));
  };

  // Handle bulk actions on selected notifications
  const handleBulkAction = (action) => {
    selectedNotifications.forEach(id => {
      if (action === 'read') {
        dispatch(markNotificationAsRead(id));
      } else if (action === 'delete') {
        dispatch(deleteNotification(id));
      }
    });
    setSelectedNotifications([]);
  };

  // Handle select notification for bulk actions
  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="mt-1 text-sm text-gray-500">
              Stay updated with your latest activities and alerts
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Create Notification Button - Only for admins */}
            {canCreateNotifications && (
              <button
                onClick={() => navigate('/dashboard/admin/create-notification')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Notification
              </button>
            )}

            {/* Unread count badge */}
            {unreadCount > 0 && (
              <div className="flex items-center space-x-2">
                <BellSolidIcon className="h-5 w-5 text-blue-600" />
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {unreadCount} unread
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        {/* Filters */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {['all', 'unread', 'read'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                filter === filterType
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              {filterType === 'unread' && unreadCount > 0 && (
                <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {selectedNotifications.length > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('read')}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Mark Read
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </>
          )}
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              Mark All Read
            </button>
          )}
          
          {notifications.length > 0 && (
            <button
              onClick={() => dispatch(clearAllNotifications())}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 border border-red-200 bg-red-50 rounded-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'unread' 
              ? 'All caught up! You\'re up to date with all notifications.'
              : 'When you receive notifications, they\'ll appear here.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`border rounded-lg p-4 transition-all hover:shadow-sm cursor-pointer ${getNotificationColor(notification.type, notification.isRead)}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start space-x-3">
                {/* Checkbox for bulk selection */}
                <input
                  type="checkbox"
                  checked={selectedNotifications.includes(notification._id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectNotification(notification._id);
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />

                {/* Notification Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type, notification.isRead)}
                </div>

                {/* Notification Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${notification.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </p>
                      <p className={`mt-1 text-sm ${notification.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      
                      {/* Additional metadata */}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>{formatTimestamp(notification.createdAt)}</span>
                        {notification.category && (
                          <span className="capitalize">{notification.category}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dispatch(markNotificationAsRead(notification._id));
                          }}
                          className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full transition-colors"
                          title="Mark as read"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification._id);
                        }}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded-full transition-colors"
                        title="Delete notification"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button (for pagination if needed) */}
      {filteredNotifications.length >= 20 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => dispatch(fetchNotifications({ offset: notifications.length }))}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Load More Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;