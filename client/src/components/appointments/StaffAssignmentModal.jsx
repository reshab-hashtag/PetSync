// client/src/components/appointments/StaffAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  XMarkIcon,
  UserGroupIcon,
  UserIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';
import { fetchStaffMembersWithBusinesses } from '../../store/slices/staffSlice';
import { assignStaffToAppointment } from '../../store/slices/appointmentSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const StaffAssignmentModal = ({ isOpen, onClose, appointment, onSuccess }) => {
  const dispatch = useDispatch();
  const { staffMembers, loading: staffLoading } = useSelector(state => state.staff);
  const { loading: appointmentLoading } = useSelector(state => state.appointments);
  
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStaff, setFilteredStaff] = useState([]);

  useEffect(() => {
    if (isOpen && appointment) {
      // Fetch staff members for the business
      dispatch(fetchStaffMembersWithBusinesses({
        businessId: appointment.business._id,
        isActive: true,
        limit: 100
      }));
      setSelectedStaffId('');
      setSearchQuery('');
    }
  }, [isOpen, appointment, dispatch]);

  useEffect(() => {
    // Filter staff based on search query
    if (staffMembers) {
      const filtered = staffMembers.filter(staff => {
        const fullName = `${staff.profile?.firstName || ''} ${staff.profile?.lastName || ''}`.toLowerCase();
        const email = staff.profile?.email?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || email.includes(query);
      });
      setFilteredStaff(filtered);
    }
  }, [staffMembers, searchQuery]);

  const handleAssignStaff = async () => {
    if (!selectedStaffId) {
      toast.error('Please select a staff member');
      return;
    }
    try {
      const result = await dispatch(assignStaffToAppointment({
        appointmentId: appointment._id,
        staffId: selectedStaffId
      }));

      if (assignStaffToAppointment.fulfilled.match(result)) {
        toast.success('Staff assigned successfully!');
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.payload || 'Failed to assign staff');


        console.log('Staff assignment error:', result.error);
      }
    } catch (error) {
        console.error('Error assigning staff:', error);
      toast.error('Failed to assign staff');
      console.error('Staff assignment error:', error);
    }
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

  if (!isOpen || !appointment) return null;

  const isLoading = staffLoading || appointmentLoading;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <UserGroupIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Staff</h2>
              <p className="text-sm text-gray-500">
                Appointment for {appointment.pet?.profile?.name} - {formatDateTime(appointment.schedule?.startTime)}
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
        <div className="p-6">
          {/* Current Assignment Status */}
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
              <span className="text-orange-800 font-medium">No staff currently assigned</span>
            </div>
            <p className="text-orange-700 text-sm mt-1">
              Please select a staff member to handle this appointment.
            </p>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Staff List */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : filteredStaff.length === 0 ? (
              <div className="text-center py-8">
                <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">
                  {searchQuery ? 'No staff found matching your search' : 'No staff members available'}
                </p>
              </div>
            ) : (
              filteredStaff.map((staff) => (
                <div
                  key={staff._id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedStaffId === staff._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedStaffId(staff._id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {staff.profile?.firstName} {staff.profile?.lastName}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {staff.profile?.email && (
                            <div className="flex items-center">
                              <EnvelopeIcon className="h-3 w-3 mr-1" />
                              {staff.profile.email}
                            </div>
                          )}
                          {staff.profile?.phone && (
                            <div className="flex items-center">
                              <PhoneIcon className="h-3 w-3 mr-1" />
                              {staff.profile.phone}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            staff.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {staff.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 capitalize">
                            {staff.role?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    {selectedStaffId === staff._id && (
                      <CheckCircleIcon className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleAssignStaff}
            disabled={!selectedStaffId || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
            Assign Staff
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffAssignmentModal;