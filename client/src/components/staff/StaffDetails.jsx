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
  ClockIcon
} from '@heroicons/react/24/outline';

const StaffDetails = ({ staff, onClose, onEdit }) => {
  if (!staff) return null;

  const getRoleBadge = (role) => {
    const styles = {
      business_admin: 'bg-purple-100 text-purple-800',
      staff: 'bg-blue-100 text-blue-800'
    };
    
    const labels = {
      business_admin: 'Business Admin',
      staff: 'Staff Member'
    };

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <>
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Active
          </>
        ) : (
          <>
            <XCircleIcon className="w-4 h-4 mr-1" />
            Inactive
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
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  const permissionModules = [
    { key: 'appointments', label: 'Appointments' },
    { key: 'clients', label: 'Clients' },
    { key: 'pets', label: 'Pets' },
    { key: 'billing', label: 'Billing' },
    { key: 'reports', label: 'Reports' }
  ];

  const hasAnyPermissions = (permissions) => {
    return Object.values(permissions).some(permission => 
      Object.values(permission).some(value => value === true)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {staff.profile.firstName} {staff.profile.lastName}
            </h2>
            <div className="mt-1 flex items-center space-x-3">
              {getRoleBadge(staff.role)}
              {getStatusBadge(staff.isActive)}
            </div>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="btn-secondary inline-flex items-center"
        >
          <PencilIcon className="w-4 h-4 mr-2" />
          Edit
        </button>
      </div>

      {/* Contact Information */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Email</p>
              <p className="text-sm text-gray-600">{staff.profile.email}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <PhoneIcon className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">Phone</p>
              <p className="text-sm text-gray-600">{staff.profile.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Specializations */}
      {staff.specializations && staff.specializations.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Specializations</h3>
          <div className="flex flex-wrap gap-2">
            {staff.specializations.map((specialization, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
              >
                {specialization}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Permissions */}
      {staff.permissions && hasAnyPermissions(staff.permissions) && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Permissions</h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    View
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Create
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delete
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {permissionModules.map((module) => {
                  const modulePermissions = staff.permissions[module.key];
                  if (!modulePermissions) return null;

                  return (
                    <tr key={module.key}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {module.label}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {modulePermissions.view ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mx-auto" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-300 mx-auto" />
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
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
                      <td className="px-4 py-4 whitespace-nowrap text-center">
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
                      <td className="px-4 py-4 whitespace-nowrap text-center">
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
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 mr-2" />
            Work Schedule
          </h3>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {daysOfWeek.map((day) => {
                const daySchedule = staff.schedule[day.key];
                return (
                  <div key={day.key} className="px-4 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 w-24">
                      {day.label}
                    </span>
                    {daySchedule?.enabled ? (
                      <span className="text-sm text-gray-600">
                        {formatTime(daySchedule.start)} - {formatTime(daySchedule.end)}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">Off</span>
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
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staff.emergencyContact.name && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Name</p>
                  <p className="text-sm text-gray-600">{staff.emergencyContact.name}</p>
                </div>
              )}
              {staff.emergencyContact.relationship && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Relationship</p>
                  <p className="text-sm text-gray-600">{staff.emergencyContact.relationship}</p>
                </div>
              )}
              {staff.emergencyContact.phone && (
                <div>
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-600">{staff.emergencyContact.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Member Since</p>
              <p className="text-sm text-gray-600">
                {new Date(staff.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Last Updated</p>
              <p className="text-sm text-gray-600">
                {new Date(staff.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            {staff.auth?.mustChangePassword && (
              <div className="md:col-span-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        This staff member must change their password on next login.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          Close
        </button>
        <button
          onClick={onEdit}
          className="btn-primary"
        >
          Edit Staff Member
        </button>
      </div>
    </div>
  );
};

export default StaffDetails;