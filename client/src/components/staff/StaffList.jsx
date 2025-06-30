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
  KeyIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { fetchStaffMembers, deleteStaffMember, toggleStaffStatus } from '../../store/slices/staffSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import StaffForm from './StaffForm';
import StaffDetails from './StaffDetails';
import toast from 'react-hot-toast';

const StaffList = () => {
  const dispatch = useDispatch();
  const { staffMembers, loading, pagination } = useSelector(state => state.staff);
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
    delete: false
  });

  const [selectedStaff, setSelectedStaff] = useState(null);

  useEffect(() => {
    dispatch(fetchStaffMembers(filters));
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
      dispatch(fetchStaffMembers(filters));
    } catch (error) {
      toast.error(error.message || 'Failed to update staff status');
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteStaffMember(selectedStaff._id)).unwrap();
      toast.success('Staff member deleted successfully');
      closeModal('delete');
      dispatch(fetchStaffMembers(filters));
    } catch (error) {
      toast.error(error.message || 'Failed to delete staff member');
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      business_admin: 'bg-purple-100 text-purple-800',
      staff: 'bg-blue-100 text-blue-800'
    };
    
    const labels = {
      business_admin: 'Admin',
      staff: 'Staff'
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
            Manage your business staff members and their permissions
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
            <option value="staff">Staff</option>
          </select>

          <div className="text-sm text-gray-500 flex items-center">
            Total: {pagination?.total || 0} staff members
          </div>
        </div>
      </div>

      {/* Staff List */}
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
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffMembers.map((staff) => (
                    <tr key={staff._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {staff.profile.firstName} {staff.profile.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {staff.profile.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(staff.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {staff.profile.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(staff.isActive)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(staff.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
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
                            onClick={() => handleToggleStatus(staff.id, staff.isActive)}
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </div>

      {/* Modals */}
      <Modal
        isOpen={modals.add}
        onClose={() => closeModal('add')}
        title="Add Staff Member"
        size="lg"
      >
        <StaffForm
          onSuccess={() => {
            closeModal('add');
            dispatch(fetchStaffMembers(filters));
          }}
          onCancel={() => closeModal('add')}
        />
      </Modal>

      <Modal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        title="Edit Staff Member"
        size="lg"
      >
        <StaffForm
          staff={selectedStaff}
          isEdit={true}
          onSuccess={() => {
            closeModal('edit');
            dispatch(fetchStaffMembers(filters));
          }}
          onCancel={() => closeModal('edit')}
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
                </strong>? This action cannot be undone.
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