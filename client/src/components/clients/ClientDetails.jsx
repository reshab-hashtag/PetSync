// client/src/components/clients/ClientDetails.jsx
import React from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  MapPinIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

const ClientDetails = ({ client, onClose, onEdit }) => {
  if (!client) return null;

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${isActive
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

  const formatAddress = (address) => {
    if (!address) return 'Address not provided';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean);
    return parts.join(', ') || 'Address not provided';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              {client.profile?.avatar ? (
                <img
                  src={client.profile.avatar}
                  alt={`${client.profile.firstName} ${client.profile.lastName}`}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {client.profile?.firstName} {client.profile?.lastName}
              </h2>
              <p className="text-gray-600">{client.email}</p>
              <div className="mt-2">
                {getStatusBadge(client.isActive)}
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="btn-primary flex items-center space-x-2"
          >
            <PencilIcon className="w-4 h-4" />
            <span>Edit Client</span>
          </button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <UserIcon className="w-5 h-5 mr-2 text-blue-600" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-gray-900">
                {client.profile?.firstName} {client.profile?.lastName}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900 flex items-center">
                <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                {client.profile?.email}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900 flex items-center">
                <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                {client.profile?.phone || 'Not provided'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Member Since</label>
              <p className="text-gray-900 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                {new Date(client.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MapPinIcon className="w-5 h-5 mr-2 text-blue-600" />
            Address Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Address</label>
              <p className="text-gray-900">
                {formatAddress(client.profile?.address)}
              </p>
            </div>
          </div>
        </div>

        {/* Pet Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <HeartIcon className="w-5 h-5 mr-2 text-blue-600" />
            Pet Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Number of Pets</label>
              <p className="text-gray-900 text-2xl font-bold text-blue-600">
                {client.pets?.length || 0}
              </p>
            </div>
            {client.pets && client.pets.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">Pet Names</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {client.pets.map((pet, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {pet.name || `Pet ${index + 1}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Account Status & Actions */}
      <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                {getStatusBadge(client.isActive)}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="text-gray-900">
                {new Date(client.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onClose}
          className="btn-secondary"
        >
          Close
        </button>
        <button
          onClick={onEdit}
          className="btn-primary flex items-center space-x-2"
        >
          <PencilIcon className="w-4 h-4" />
          <span>Edit Client</span>
        </button>
      </div>
    </div>
  );
};

export default ClientDetails;