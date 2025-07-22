import React, { useState } from 'react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  TagIcon,
  DocumentTextIcon,
  StarIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useSelector } from 'react-redux';
import StaffAssignmentModal from './StaffAssignmentModal';

const AppointmentDetailsModal = ({ isOpen, onClose, appointment, onRefresh }) => {
  const { user } = useSelector((state) => state.auth);
  const [showStaffAssignment, setShowStaffAssignment] = useState(false);

  if (!isOpen || !appointment) return null;

  // Status styling functions
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff_assignment_pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'no_show':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <CalendarIcon className="h-5 w-5" />;
      case 'staff_assignment_pending':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'in_progress':
        return <PlayCircleIcon className="h-5 w-5" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5" />;
      case 'no_show':
        return <PauseCircleIcon className="h-5 w-5" />;
      default:
        return <ClockIcon className="h-5 w-5" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'staff_assignment_pending':
        return 'Staff Assignment Pending';
      default:
        return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleStaffAssignmentSuccess = () => {
    setShowStaffAssignment(false);
    onRefresh?.(); // Refresh appointment data
  };

  // Check if user is business admin and staff is not assigned
  const showAssignStaffButton = user?.role === 'business_admin' && 
    !appointment.staff?.assigned && 
    appointment.status !== 'completed' && 
    appointment.status !== 'cancelled';

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Appointment Details</h2>
                <p className="text-sm text-gray-500">
                  Created on {formatDateTime(appointment.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-md hover:bg-gray-100"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-8">
            {/* Status and Quick Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <span className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(appointment.status)}`}>
                    {getStatusIcon(appointment.status)}
                    <span className="ml-2">{getStatusText(appointment.status)}</span>
                  </span>
                  <div className="text-sm text-gray-600">
                    ID: {appointment._id?.slice(-8)?.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {appointment.service?.duration || appointment.duration || 'N/A'} min
                  </div>
                  <div className="flex items-center">
                    <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                    {formatCurrency(appointment.service?.price?.amount || appointment.price)}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Client Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Client Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">
                        {appointment.client?.profile?.firstName} {appointment.client?.profile?.lastName}
                      </p>
                    </div>
                    {appointment.client?.profile?.email && (
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{appointment.client.profile.email}</span>
                      </div>
                    )}
                    {appointment.client?.profile?.phone && (
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">{appointment.client.profile.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pet Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TagIcon className="h-5 w-5 mr-2" />
                    Pet Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Pet Name</label>
                      <p className="text-gray-900">{appointment.pet?.profile?.name || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Species</label>
                        <p className="text-gray-900">{appointment.pet?.profile?.species || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Breed</label>
                        <p className="text-gray-900">{appointment.pet?.profile?.breed || 'N/A'}</p>
                      </div>
                    </div>
                    {appointment.pet?.profile?.age && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Age</label>
                        <p className="text-gray-900">{appointment.pet.profile.age}</p>
                      </div>
                    )}
                    {appointment.pet?.profile?.weight && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Weight</label>
                        <p className="text-gray-900">{appointment.pet.profile.weight}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Service Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <TagIcon className="h-5 w-5 mr-2" />
                    Service Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Service</label>
                      <p className="text-gray-900 font-medium">{appointment.service?.name || 'N/A'}</p>
                    </div>
                    {appointment.service?.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-gray-600">{appointment.service.description}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Duration</label>
                        <p className="text-gray-900">{appointment.service?.duration || appointment.duration || 'N/A'} minutes</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Price</label>
                        <p className="text-gray-900 font-semibold">{formatCurrency(appointment.service?.price?.amount || appointment.price)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Schedule Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Schedule
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date</label>
                      <p className="text-gray-900 font-medium">{formatDate(appointment.schedule?.startTime || appointment.date)}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Start Time</label>
                        <p className="text-gray-900">{formatTime(appointment.schedule?.startTime || appointment.startTime)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">End Time</label>
                        <p className="text-gray-900">{formatTime(appointment.schedule?.endTime || appointment.endTime)}</p>
                      </div>
                    </div>
                    {appointment.schedule?.timezone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Timezone</label>
                        <p className="text-gray-900">{appointment.schedule.timezone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Staff Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    Staff Assignment
                  </h3>
                  {appointment.staff?.assigned ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Assigned Staff</label>
                        <p className="text-gray-900 font-medium">
                          {appointment.staff.assigned.profile?.firstName} {appointment.staff.assigned.profile?.lastName}
                        </p>
                      </div>
                      {appointment.staff.assigned.profile?.email && (
                        <div className="flex items-center">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">{appointment.staff.assigned.profile.email}</span>
                        </div>
                      )}
                      {appointment.staff.assignedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Assigned On</label>
                          <p className="text-gray-900">{formatDateTime(appointment.staff.assignedAt)}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <ExclamationTriangleIcon className="h-8 w-8 text-orange-400 mx-auto mb-2" />
                      <p className="text-gray-500">No staff assigned yet</p>
                      {appointment.status === 'staff_assignment_pending' && (
                        <p className="text-sm text-orange-600 mt-1">Staff assignment is pending</p>
                      )}
                      
                      {/* Assign Staff Button */}
                      {/* {showAssignStaffButton && ( */}
                        <button
                          onClick={() => setShowStaffAssignment(true)}
                          className="mt-3 inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                        >
                          <PlusIcon className="h-4 w-4 mr-1" />
                          Assign Staff
                        </button>
                      {/* )} */}
                    </div>
                  )}
                </div>

                {/* Business Information */}
                {appointment.business && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                      Business
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Business Name</label>
                        <p className="text-gray-900 font-medium">{appointment.business.profile?.name || 'N/A'}</p>
                      </div>
                      {appointment.business.profile?.phone && (
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">{appointment.business.profile.phone}</span>
                        </div>
                      )}
                      {appointment.business.profile?.address && (
                        <div className="flex items-start">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                          <div className="text-gray-600">
                            {appointment.business.profile.address.street && (
                              <p>{appointment.business.profile.address.street}</p>
                            )}
                            <p>
                              {appointment.business.profile.address.city}
                              {appointment.business.profile.address.state && `, ${appointment.business.profile.address.state}`}
                              {appointment.business.profile.address.zipCode && ` ${appointment.business.profile.address.zipCode}`}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes and Special Requests */}
            {(appointment.details?.notes || appointment.details?.specialRequests) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  Notes & Requests
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {appointment.details?.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Notes</label>
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-gray-700 text-sm">{appointment.details.notes}</p>
                      </div>
                    </div>
                  )}
                  {appointment.details?.specialRequests && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Special Requests</label>
                      <div className="bg-yellow-50 rounded-md p-3">
                        <p className="text-gray-700 text-sm">{appointment.details.specialRequests}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Billing Information */}
            {(appointment.billing?.invoice || appointment.billing?.additionalCharges?.length > 0) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                  Billing Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Service Price</span>
                    <span className="font-medium">{formatCurrency(appointment.service?.price?.amount || appointment.price)}</span>
                  </div>
                  {appointment.billing?.additionalCharges?.map((charge, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{charge.description}</span>
                      <span className="font-medium">{formatCurrency(charge.amount)}</span>
                    </div>
                  ))}
                  {appointment.billing?.discounts?.map((discount, index) => (
                    <div key={index} className="flex justify-between items-center text-green-600">
                      <span>{discount.description}</span>
                      <span>-{formatCurrency(discount.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total</span>
                      <span>{formatCurrency(
                        (appointment.service?.price?.amount || appointment.price || 0) +
                        (appointment.billing?.additionalCharges?.reduce((sum, charge) => sum + charge.amount, 0) || 0) -
                        (appointment.billing?.discounts?.reduce((sum, discount) => sum + discount.amount, 0) || 0)
                      )}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Feedback */}
            {appointment.feedback && (appointment.feedback.rating || appointment.feedback.review) && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <StarIcon className="h-5 w-5 mr-2" />
                  Client Feedback
                </h3>
                <div className="space-y-3">
                  {appointment.feedback.rating && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Rating</label>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`h-5 w-5 ${
                              star <= appointment.feedback.rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          ({appointment.feedback.rating}/5)
                        </span>
                      </div>
                    </div>
                  )}
                  {appointment.feedback.review && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Review</label>
                      <div className="bg-gray-50 rounded-md p-3">
                        <p className="text-gray-700 text-sm">{appointment.feedback.review}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Close
              </button>
              {user?.role === 'business_admin' && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <button className="btn-primary">
                  Edit Appointment
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Assignment Modal */}
      <StaffAssignmentModal
        isOpen={showStaffAssignment}
        onClose={() => setShowStaffAssignment(false)}
        appointment={appointment}
        onSuccess={handleStaffAssignmentSuccess}
      />
    </>
  );
};

export default AppointmentDetailsModal;