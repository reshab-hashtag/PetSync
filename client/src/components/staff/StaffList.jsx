// client/src/components/staff/StaffList.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  UsersIcon,
  UserGroupIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  fetchStaffMembersWithBusinesses, 
  deleteStaffMember, 
  toggleStaffStatus,
  setViewMode,
  toggleStaffExpansion as toggleStaffExpansionAction
} from '../../store/slices/staffSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import StaffForm from './StaffForm';
import StaffDetails from './StaffDetails';
import BusinessAssignmentModal from './BusinessAssignmentModal';
import toast from 'react-hot-toast';

const StaffList = () => {
  const dispatch = useDispatch();
  const { staffMembers, loading, pagination, expandedStaff } = useSelector(state => state.staff);
  const { user } = useSelector(state => state.auth);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    role: 'all',
    page: 1
  });

  const [modals, setModals] = useState({
    add: false,
    edit: false,
    view: false,
    delete: false,
    businessAssignment: false
  });

  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    // Use the enhanced fetch that includes business details
    dispatch(fetchStaffMembersWithBusinesses(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const openModal = (type, staff = null) => {
    setSelectedStaff(staff);
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
    setSelectedStaff(null);
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    try {
      await dispatch(toggleStaffStatus({
        id: staffId,
        isActive: !currentStatus
      })).unwrap();
      
      toast.success(`Staff member ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      dispatch(fetchStaffMembersWithBusinesses(filters));
    } catch (error) {
      toast.error(error.message || 'Failed to update staff status');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteStaffMember(selectedStaff._id)).unwrap();
      toast.success('Staff member deleted successfully');
      closeModal('delete');
      dispatch(fetchStaffMembersWithBusinesses(filters));
    } catch (error) {
      toast.error(error.message || 'Failed to delete staff member');
    }
  };

  const toggleStaffExpansion = (staffId) => {
    dispatch(toggleStaffExpansionAction(staffId));
  };

  const getRoleBadge = (role) => {
    const styles = {
      business_admin: 'bg-purple-100 text-purple-800',
      staff: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800'
    };
    
    const labels = {
      business_admin: 'Admin',
      staff: 'Staff',
      manager: 'Manager'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[role] || 'bg-gray-100 text-gray-800'}`}>
        {labels[role] || role}
      </span>
    );
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? (
          <>
            <CheckIcon className="w-3 h-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <XMarkIcon className="w-3 h-3 mr-1" />
            Inactive
          </>
        )}
      </span>
    );
  };

  const getBusinessBadge = (businessCount) => {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        <BuildingOfficeIcon className="w-3 h-3 mr-1" />
        {businessCount} Business{businessCount !== 1 ? 'es' : ''}
      </span>
    );
  };

  if (loading && !staffMembers.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your business staff members and their business assignments
          </p>
        </div>
        <button
          onClick={() => openModal('add')}
          className="btn-primary inline-flex items-center"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Staff Member
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search staff..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          <select
            className="input-field"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            className="input-field"
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="business_admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            Total: {pagination?.total || 0} staff members
          </div>
        </div>
      </div>

      {/* Staff List with Business Hierarchy */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {staffMembers.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No staff members</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first staff member.
            </p>
            <div className="mt-6">
              <button
                onClick={() => openModal('add')}
                className="btn-primary inline-flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Staff Member
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {staffMembers.map((staff) => (
              <div key={staff._id}>
                {/* Staff Member Row */}
                <div className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleStaffExpansion(staff._id)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandedStaff.includes(staff._id) ? (
                          <ChevronDownIcon className="h-5 w-5" />
                        ) : (
                          <ChevronRightIcon className="h-5 w-5" />
                        )}
                      </button>

                      {/* Staff Info */}
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex flex-col items-start">
                          <div className="text-sm font-medium text-gray-900">
                            {staff.profile.firstName} {staff.profile.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {staff.profile.email}
                          </div>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex space-x-2">
                        {getRoleBadge(staff.role)}
                        {getStatusBadge(staff.isActive)}
                        {staff.business && getBusinessBadge(staff.business.length)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500">
                        Joined: {new Date(staff.createdAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openModal('businessAssignment', staff)}
                          className="text-purple-600 hover:text-purple-900"
                          title="Manage Business Assignments"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openModal('view', staff)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openModal('edit', staff)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(staff._id, staff.isActive)}
                          className={`${staff.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={staff.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {staff.isActive ? <XMarkIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => openModal('delete', staff)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Business List */}
                {expandedStaff.includes(staff._id) && (
                  <div className="bg-gray-50 border-t border-gray-200">
                    <div className="px-6 py-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                        Assigned Businesses ({staff.business ? staff.business.length : 0})
                      </h4>
                      
                      {staff.business && staff.business.length > 0 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              Click on a business card to view details
                            </div>
                            <button
                              onClick={() => openModal('businessAssignment', staff)}
                              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 transition-colors"
                            >
                              Manage Assignments
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {staff.business.map((business, index) => (
                              <div
                                key={business._id || index}
                                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors cursor-pointer"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="flex-shrink-0">
                                    <BuildingOfficeIcon className="h-8 w-8 text-indigo-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {business.profile?.name || business.name || 'Business Name'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                      {business.profile?.email || business.email || 'No email'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {business.profile?.phone || business.phone || 'No phone'}
                                    </p>
                                    <div className="mt-2 flex items-center space-x-2">
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        business.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {business.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                      {business.staff && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          <UsersIcon className="w-3 h-3 mr-1" />
                                          {business.staff.length} Staff
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <BuildingOfficeIcon className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-500">
                            This staff member is not assigned to any businesses yet.
                          </p>
                          <button
                            onClick={() => openModal('businessAssignment', staff)}
                            className="mt-3 text-sm bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
                          >
                            Assign to Businesses
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(pagination.current - 1) * pagination.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.current * pagination.limit, pagination.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.current - 1)}
                    disabled={pagination.current === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.current
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(pagination.current + 1)}
                    disabled={pagination.current === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={modals.add}
        onClose={() => closeModal('add')}
        title="Add Staff Member"
        size="xl"
      >
        <StaffForm
          onSuccess={() => {
            closeModal('add');
            dispatch(fetchStaffMembersWithBusinesses(filters));
          }}
          onCancel={() => closeModal('add')}
        />
      </Modal>

      <Modal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        title="Edit Staff Member"
        size="xl"
      >
        <StaffForm
          staff={selectedStaff}
          isEdit={true}
          onSuccess={() => {
            closeModal('edit');
            dispatch(fetchStaffMembersWithBusinesses(filters));
          }}
          onCancel={() => closeModal('edit')}
        />
      </Modal>

      <Modal
        isOpen={modals.businessAssignment}
        onClose={() => closeModal('businessAssignment')}
        title="Manage Business Assignments"
        size="lg"
      >
        <BusinessAssignmentModal
          isOpen={modals.businessAssignment}
          onClose={() => closeModal('businessAssignment')}
          staff={selectedStaff}
          onSuccess={() => {
            closeModal('businessAssignment');
            dispatch(fetchStaffMembersWithBusinesses(filters));
          }}
        />
      </Modal>

      <Modal
        isOpen={modals.view}
        onClose={() => closeModal('view')}
        title="Staff Member Details"
        size="lg"
      >
        <StaffDetails
          staff={selectedStaff}
          onClose={() => closeModal('view')}
          onEdit={() => {
            closeModal('view');
            openModal('edit', selectedStaff);
          }}
        />
      </Modal>

      <Modal
        isOpen={modals.delete}
        onClose={() => closeModal('delete')}
        title="Delete Staff Member"
      >
        <div className="sm:flex sm:items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
            <TrashIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Delete Staff Member
            </h3>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to delete{' '}
                <strong>
                  {selectedStaff?.profile.firstName} {selectedStaff?.profile.lastName}
                </strong>? This action cannot be undone and will remove them from all assigned businesses.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            onClick={handleDelete}
          >
            Delete
          </button>
          <button
            type="button"
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            onClick={() => closeModal('delete')}
          >
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default StaffList;