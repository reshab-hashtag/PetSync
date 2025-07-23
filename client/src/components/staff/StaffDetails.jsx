// client/src/components/staff/StaffDetails.jsx
import React from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ClockIcon,
  SparklesIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const StaffDetails = ({ staff, onClose, onEdit }) => {
  if (!staff) return null;

  const getRoleBadge = (role) => {
    const config = {
      business_admin: {
        bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
        text: 'text-white',
        icon: '👑',
        label: 'Business Admin'
      },
      staff: {
        bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
        text: 'text-white',
        icon: '👤',
        label: 'Staff Member'
      },
      manager: {
        bg: 'bg-gradient-to-r from-green-500 to-green-600',
        text: 'text-white',
        icon: '⭐',
        label: 'Manager'
      }
    };

    const roleConfig = config[role] || {
      bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
      text: 'text-white',
      icon: '?',
      label: role
    };

    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${roleConfig.bg} ${roleConfig.text}`}>
        <span className="mr-1.5">{roleConfig.icon}</span>
        {roleConfig.label}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold shadow-lg ${
        isActive 
          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
          : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      }`}>
        {isActive ? (
          <>
            <CheckCircleIcon className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Active</span>
            <span className="sm:hidden">✓</span>
          </>
        ) : (
          <>
            <XCircleIcon className="w-4 h-4 mr-1.5" />
            <span className="hidden sm:inline">Inactive</span>
            <span className="sm:hidden">✗</span>
          </>
        )}
      </span>
    );
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday', short: 'Mon' },
    { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
    { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
    { key: 'thursday', label: 'Thursday', short: 'Thu' },
    { key: 'friday', label: 'Friday', short: 'Fri' },
    { key: 'saturday', label: 'Saturday', short: 'Sat' },
    { key: 'sunday', label: 'Sunday', short: 'Sun' }
  ];

  const permissionModules = [
    { key: 'appointments', label: 'Appointments', icon: '📅' },
    { key: 'clients', label: 'Clients', icon: '👥' },
    { key: 'pets', label: 'Pets', icon: '🐕' },
    { key: 'billing', label: 'Billing', icon: '💳' },
    { key: 'reports', label: 'Reports', icon: '📊' }
  ];

  const hasAnyPermissions = (permissions) => {
    return Object.values(permissions).some(permission => 
      Object.values(permission).some(value => value === true)
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl max-h-[80vh] overflow-y-auto">
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0 bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          {/* Avatar with Status */}
          <div className="relative mx-auto sm:mx-0">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center ring-4 ring-white shadow-xl">
              <UserIcon className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
            </div>
            {/* Status indicator */}
            <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-4 border-white shadow-lg ${
              staff.isActive ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <div className={`h-full w-full rounded-full ${
                staff.isActive ? 'animate-pulse bg-green-400' : ''
              }`}></div>
            </div>
          </div>
          
          <div className="text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {staff.profile.firstName} {staff.profile.lastName}
            </h2>
            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
              {getRoleBadge(staff.role)}
              {getStatusBadge(staff.isActive)}
            </div>
          </div>
        </div>
        
        <button
          onClick={onEdit}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 inline-flex items-center justify-center w-full sm:w-auto"
        >
          <PencilIcon className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Edit</span>
          <span className="sm:hidden">Edit Staff</span>
        </button>
      </div>

      {/* Contact Information */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg mr-3">
            <EnvelopeIcon className="h-5 w-5 text-blue-600" />
          </div>
          Contact Information
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div className="p-2 bg-blue-100 rounded-lg">
              <EnvelopeIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Email</p>
              <p className="text-sm text-gray-600 truncate">{staff.profile.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <div className="p-2 bg-green-100 rounded-lg">
              <PhoneIcon className="h-5 w-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">Phone</p>
              <p className="text-sm text-gray-600 truncate">{staff.profile.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Specializations */}
      {staff.specializations && staff.specializations.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg mr-3">
              <SparklesIcon className="h-5 w-5 text-purple-600" />
            </div>
            Specializations
          </h3>
          <div className="flex flex-wrap gap-2">
            {staff.specializations.map((specialization, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg"
              >
                ⭐ {specialization}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Permissions */}
      {staff.permissions && hasAnyPermissions(staff.permissions) && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <div className="p-2 bg-green-100 rounded-lg mr-3">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
            </div>
            Permissions
          </h3>
          
          {/* Mobile: Card Layout */}
          <div className="block lg:hidden space-y-3">
            {permissionModules.map((module) => {
              const modulePermissions = staff.permissions[module.key];
              if (!modulePermissions) return null;

              return (
                <div key={module.key} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-semibold text-gray-900 flex items-center">
                      <span className="mr-2">{module.icon}</span>
                      {module.label}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(modulePermissions).map(([permission, value]) => (
                      <div key={permission} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">{permission}</span>
                        {value ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-gray-300" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    View
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Create
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Edit
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissionModules.map((module) => {
                  const modulePermissions = staff.permissions[module.key];
                  if (!modulePermissions) return null;

                  return (
                    <tr key={module.key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <span className="flex items-center">
                          <span className="mr-2">{module.icon}</span>
                          {module.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {modulePermissions.view ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {modulePermissions.create !== undefined ? (
                          modulePermissions.create ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {modulePermissions.edit !== undefined ? (
                          modulePermissions.edit ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {modulePermissions.delete !== undefined ? (
                          modulePermissions.delete ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircleIcon className="h-5 w-5 text-gray-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Work Schedule */}
      {staff.schedule && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
              <ClockIcon className="h-5 w-5 text-indigo-600" />
            </div>
            Work Schedule
          </h3>
          
          {/* Mobile: Card Layout */}
          <div className="block sm:hidden space-y-2">
            {daysOfWeek.map((day) => {
              const daySchedule = staff.schedule[day.key];
              return (
                <div key={day.key} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-900">
                    {day.short}
                  </span>
                  {daySchedule?.enabled ? (
                    <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      {formatTime(daySchedule.start)} - {formatTime(daySchedule.end)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded-full">Off</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden sm:block bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-200">
              {daysOfWeek.map((day) => {
                const daySchedule = staff.schedule[day.key];
                return (
                  <div key={day.key} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <span className="text-sm font-semibold text-gray-900 w-32">
                      {day.label}
                    </span>
                    {daySchedule?.enabled ? (
                      <span className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full">
                        {formatTime(daySchedule.start)} - {formatTime(daySchedule.end)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Off</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact */}
      {staff.emergencyContact && (staff.emergencyContact.name || staff.emergencyContact.phone) && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
            <div className="p-2 bg-red-100 rounded-lg mr-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            Emergency Contact
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {staff.emergencyContact.name && (
              <div className="p-3 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-900">Name</p>
                <p className="text-sm text-gray-600">{staff.emergencyContact.name}</p>
              </div>
            )}
            {staff.emergencyContact.relationship && (
              <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-900">Relationship</p>
                <p className="text-sm text-gray-600">{staff.emergencyContact.relationship}</p>
              </div>
            )}
            {staff.emergencyContact.phone && (
              <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
                <p className="text-sm font-semibold text-gray-900">Phone</p>
                <p className="text-sm text-gray-600">{staff.emergencyContact.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
          <div className="p-2 bg-gray-100 rounded-lg mr-3">
            <CalendarIcon className="h-5 w-5 text-gray-600" />
          </div>
          Account Information
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <p className="text-sm font-semibold text-gray-900">Member Since</p>
            <p className="text-sm text-gray-600">
              {new Date(staff.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
            <p className="text-sm font-semibold text-gray-900">Last Updated</p>
            <p className="text-sm text-gray-600">
              {new Date(staff.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          {staff.auth?.mustChangePassword && (
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-semibold text-yellow-800">Password Change Required</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This staff member must change their password on next login.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Actions */}
      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Close
        </button>
        <button
          onClick={onEdit}
          className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Edit Staff Member
        </button>
      </div>
    </div>
  );
};

export default StaffDetails;