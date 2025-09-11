import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  UserGroupIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  MegaphoneIcon,
  ClockIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getClients } from '../../store/slices/clientSlice';
import { fetchStaffMembersWithBusinesses } from '../../store/slices/staffSlice';
import { fetchBusinesses } from '../../store/slices/businessSlice';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminCreateNotificationPage = () => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { clients } = useSelector(state => state.client);
  const { staffMembers } = useSelector(state => state.staff);
  const { businesses } = useSelector(state => state.business);

  // Check user permissions
  const isSuperAdmin = user?.role === 'super_admin';
  const isBusinessAdmin = user?.role === 'business_admin';

  const [isLoading, setIsLoading] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'system',
    category: 'general',
    priority: 'normal',
    targetType: 'specific', // specific, role, business, all
    targetUsers: [],
    targetRole: '',
    targetBusiness: '',
    actionUrl: '',
    scheduledFor: '',
    expiresAt: ''
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Fetch data on component mount based on user role
  useEffect(() => {
    if (isBusinessAdmin) {
      dispatch(getClients());
      dispatch(fetchStaffMembersWithBusinesses());
    } else if (isSuperAdmin) {
      dispatch(fetchBusinesses());
    }
  }, [dispatch, isBusinessAdmin, isSuperAdmin]);

  // Clear targetUsers when targetType changes to non-specific
  useEffect(() => {
    if (notificationData.targetType !== 'specific') {
      setNotificationData(prev => ({
        ...prev,
        targetUsers: []
      }));
    }
  }, [notificationData.targetType]);

  // Notification types with icons and colors
  const notificationTypes = [
    { value: 'system', label: 'System', icon: InformationCircleIcon, color: 'text-blue-600' },
    { value: 'appointment', label: 'Appointment', icon: ClockIcon, color: 'text-green-600' },
    { value: 'payment', label: 'Payment', icon: CheckCircleIcon, color: 'text-emerald-600' },
    { value: 'warning', label: 'Warning', icon: ExclamationTriangleIcon, color: 'text-yellow-600' },
    { value: 'info', label: 'Information', icon: InformationCircleIcon, color: 'text-blue-600' },
    { value: 'marketing', label: 'Marketing', icon: MegaphoneIcon, color: 'text-purple-600' }
  ];

  // Priority levels
  const priorityLevels = [
    { value: 'low', label: 'Low', color: 'text-gray-600' },
    { value: 'normal', label: 'Normal', color: 'text-blue-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  // Get user roles based on current user's permissions
  const getUserRoles = () => {
    if (isSuperAdmin) {
      return [
        { value: 'business_admin', label: 'Business Admins' },
        { value: 'staff', label: 'All Staff Members' },
        { value: 'client', label: 'All Clients' }
      ];
    } else if (isBusinessAdmin) {
      return [
        { value: 'staff', label: 'Staff Members' },
        { value: 'client', label: 'Clients' }
      ];
    }
    return [];
  };

  // Predefined templates
  const notificationTemplates = {
    appointment_reminder: {
      title: 'Appointment Reminder',
      message: 'You have an upcoming appointment scheduled. Please arrive 10 minutes early.',
      type: 'appointment',
      category: 'appointment_reminder'
    },
    system_maintenance: {
      title: 'Scheduled Maintenance',
      message: 'Our system will undergo maintenance from [TIME] to [TIME]. Services may be temporarily unavailable.',
      type: 'system',
      category: 'system_maintenance',
      priority: 'high'
    },
    payment_reminder: {
      title: 'Payment Reminder',
      message: 'You have an outstanding payment. Please complete your payment to avoid service interruption.',
      type: 'payment',
      category: 'payment_reminder',
      priority: 'high'
    },
    holiday_hours: {
      title: 'Holiday Schedule Update',
      message: 'Our business hours will be different during the holiday season. Please check our updated schedule.',
      type: 'info',
      category: 'business_update'
    },
    new_service: {
      title: 'New Service Available',
      message: 'We\'re excited to announce a new service! Book your appointment today.',
      type: 'marketing',
      category: 'business_update'
    }
  };

  // Get available users based on target type and user role
  const getAvailableUsers = () => {
    if (!isBusinessAdmin && !isSuperAdmin) return [];

    let users = [];
    if (notificationData.targetType === 'specific') {
      if (isBusinessAdmin) {
        users = [
          ...clients
            .filter(client => client._id && client._id !== null && client._id !== undefined)
            .map(client => ({ 
              ...client, 
              userType: 'Client',
              name: `${client.profile?.firstName || ''} ${client.profile?.lastName || ''}`.trim() || 'Unnamed Client'
            })),
          ...staffMembers
            .filter(staff => staff._id && staff._id !== null && staff._id !== undefined && staff.businessId === user.businessId)
            .map(staff => ({ 
              ...staff, 
              userType: 'Staff',
              name: `${staff.profile?.firstName || ''} ${staff.profile?.lastName || ''}`.trim() || 'Unnamed Staff'
            }))
        ];
      } else if (isSuperAdmin) {
        users = businesses
          .filter(business => business.owner && business.owner._id && business.owner._id !== null && business.owner._id !== undefined)
          .map(business => ({
            _id: business.owner._id,
            userType: 'Business Admin',
            name: `${business.owner.profile?.firstName || ''} ${business.owner.profile?.lastName || ''}`.trim() || business.profile?.businessName || 'Business Admin',
            profile: business.owner.profile,
            email: business.owner.profile?.email || business.owner.email,
            businessName: business.profile?.businessName
          }));
      }
    }
    console.log('Available Users:', users); // Debug log
    return users;
  };

  // Get target options based on user role
  const getTargetOptions = () => {
    if (isSuperAdmin) {
      return [
        { value: 'specific', label: 'Specific Business Admins' },
        { value: 'business', label: 'All Users in Specific Business' },
      ];
    } else if (isBusinessAdmin) {
      return [
        { value: 'specific', label: 'Specific Users' },
        { value: 'role', label: 'All Users by Role' }
      ];
    }
    return [];
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setNotificationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle template selection
  const handleTemplateSelect = (templateKey) => {
    const template = notificationTemplates[templateKey];
    setNotificationData(prev => ({
      ...prev,
      ...template
    }));
    setSelectedTemplate(templateKey);
  };

  // Handle user selection for specific targeting
  const handleUserToggle = (userId) => {
    console.log('Toggling userId:', userId); // Debug log
    const isSelected = notificationData.targetUsers.includes(userId);
    const newTargetUsers = isSelected
      ? notificationData.targetUsers.filter(id => id !== userId)
      : [...notificationData.targetUsers, userId];

    console.log('New targetUsers:', newTargetUsers); // Debug log
    handleInputChange('targetUsers', newTargetUsers);
  };

  // Send notification using direct API call
  const handleSendNotification = async () => {
    if (!notificationData.title.trim() || !notificationData.message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }

    if (notificationData.targetType === 'specific' && notificationData.targetUsers.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    if (notificationData.targetType === 'role' && !notificationData.targetRole) {
      toast.error('Please select a role');
      return;
    }

    if (notificationData.targetType === 'business' && !notificationData.targetBusiness) {
      toast.error('Please select a business');
      return;
    }

    const cleanTargetUsers = notificationData.targetUsers.filter(userId => userId !== null && userId !== undefined);

    if (notificationData.targetType === 'specific' && cleanTargetUsers.length === 0) {
      toast.error('Please select valid recipients');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...notificationData,
        targetUsers: cleanTargetUsers,
        businessId: isBusinessAdmin ? user.businessId : notificationData.targetBusiness
      };

      console.log('Sending payload:', payload);

      const response = await api.post('/notifications/bulk', payload);

      if (response.data.success) {
        toast.success(`Notification sent successfully to ${response.data.data?.recipientCount || 'selected'} users`);
        
        setNotificationData({
          title: '',
          message: '',
          type: 'system',
          category: 'general',
          priority: 'normal',
          targetType: 'specific',
          targetUsers: [],
          targetRole: '',
          targetBusiness: '',
          actionUrl: '',
          scheduledFor: '',
          expiresAt: ''
        });
        setSelectedTemplate('');
      } else {
        toast.error(response.data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error(error.response?.data?.message || 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  // Get target summary for preview
  const getTargetSummary = () => {
    switch (notificationData.targetType) {
      case 'specific':
        if (isSuperAdmin) {
          return `${notificationData.targetUsers.length} selected business admins`;
        }
        return `${notificationData.targetUsers.length} selected users`;
      case 'role':
        return `All ${notificationData.targetRole}s`;
      case 'business':
        const business = businesses.find(b => b._id === notificationData.targetBusiness);
        return `All users in ${business?.profile?.businessName || 'selected business'}`;
      case 'all':
        return 'All users in the system';
      default:
        return 'No recipients selected';
    }
  };

  // Permission check
  if (!isBusinessAdmin && !isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to create notifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BellSolidIcon className="h-8 w-8 text-blue-600 mr-3" />
              Create Notification
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Send notifications to users in your {isSuperAdmin ? 'system' : 'business'}
            </p>
            {isSuperAdmin && (
              <p className="mt-1 text-xs text-amber-600">
                As Super Admin, use role-based targeting for staff and clients. Specific targeting is only for business admins.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {previewMode ? 'Edit' : 'Preview'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {!previewMode ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Notification Details</h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Quick Templates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Quick Templates
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(notificationTemplates).map(([key, template]) => (
                      <button
                        key={key}
                        onClick={() => handleTemplateSelect(key)}
                        className={`p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors ${
                          selectedTemplate === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">{template.title}</div>
                        <div className="text-xs text-gray-500 mt-1 truncate">{template.message}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={notificationData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notification title"
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {notificationData.title.length}/200 characters
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={notificationData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter notification message"
                    maxLength={1000}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {notificationData.message.length}/1000 characters
                  </div>
                </div>

                {/* Type and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={notificationData.type}
                      onChange={(e) => handleInputChange('type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {notificationTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={notificationData.priority}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {priorityLevels.map(priority => (
                        <option key={priority.value} value={priority.value}>
                          {priority.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Action URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={notificationData.actionUrl}
                    onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="/dashboard/appointments"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Where users will be redirected when they click the notification
                  </div>
                </div>

                {/* Scheduling and Expiration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Schedule For (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={notificationData.scheduledFor}
                      onChange={(e) => handleInputChange('scheduledFor', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expires At (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={notificationData.expiresAt}
                      onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Notification Preview</h2>
              </div>

              <div className="p-6">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {notificationTypes.find(type => type.value === notificationData.type)?.icon && (
                        React.createElement(
                          notificationTypes.find(type => type.value === notificationData.type).icon,
                          { className: `h-6 w-6 ${notificationTypes.find(type => type.value === notificationData.type).color}` }
                        )
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notificationData.title || 'Notification Title'}
                      </p>
                      <p className="mt-1 text-sm text-gray-700">
                        {notificationData.message || 'Notification message will appear here...'}
                      </p>
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Just now</span>
                        <span className="capitalize">{notificationData.type}</span>
                        <span className={`capitalize ${priorityLevels.find(p => p.value === notificationData.priority)?.color}`}>
                          {notificationData.priority} priority
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <p><strong>Recipients:</strong> {getTargetSummary()}</p>
                  {notificationData.actionUrl && (
                    <p><strong>Action URL:</strong> {notificationData.actionUrl}</p>
                  )}
                  {notificationData.scheduledFor && (
                    <p><strong>Scheduled for:</strong> {new Date(notificationData.scheduledFor).toLocaleString()}</p>
                  )}
                  {notificationData.expiresAt && (
                    <p><strong>Expires at:</strong> {new Date(notificationData.expiresAt).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recipients Panel */}
        <div className="space-y-6">
          {/* Target Type Selection */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recipients</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Target Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send to
                </label>
                <select
                  value={notificationData.targetType}
                  onChange={(e) => handleInputChange('targetType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  {getTargetOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              {notificationData.targetType === 'role' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <select
                    value={notificationData.targetRole}
                    onChange={(e) => handleInputChange('targetRole', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a role</option>
                    {getUserRoles().map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Business Selection (Super Admin only) */}
              {notificationData.targetType === 'business' && isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Business
                  </label>
                  <select
                    value={notificationData.targetBusiness}
                    onChange={(e) => handleInputChange('targetBusiness', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a business</option>
                    {businesses.map(business => (
                      <option key={business._id} value={business._id}>
                        {business.adminInfo?.firstName || 'Unnamed Business'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specific Users Selection */}
              {notificationData.targetType === 'specific' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {isSuperAdmin ? 'Select Business Admins' : 'Select Users'} ({notificationData.targetUsers.length} selected)
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    {getAvailableUsers().map(user => (
                      <div
                        key={user._id}
                        className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={notificationData.targetUsers.includes(user._id)}
                          onChange={() => handleUserToggle(user._id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {user.userType} • {user.profile?.email || user.email}
                            {user.businessName && ` • ${user.businessName}`}
                          </div>
                        </div>
                      </div>
                    ))}
                    {getAvailableUsers().length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        {isSuperAdmin ? 'No business admins available for selection' : 'No users available for selection'}
                      </div>
                    )}
                  </div>
                  {isSuperAdmin && notificationData.targetType === 'specific' && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
                      Super Admin can only select specific business admins. Use role-based targeting for staff and clients.
                    </div>
                  )}
                </div>
              )}

              {/* Recipients Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm text-blue-800">
                    <strong>Recipients:</strong> {getTargetSummary()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            onClick={handleSendNotification}
            disabled={isLoading || !notificationData.title.trim() || !notificationData.message.trim()}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                Send Notification
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminCreateNotificationPage;