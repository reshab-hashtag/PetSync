import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserCircleIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { getClients, deleteClient, toggleClientStatus, setFilters } from '../../store/slices/clientSlice';
import ClientRegistrationForm from './ClientRegistrationForm';
import ClientForm from './ClientForm';
import ClientDetails from './ClientDetails';
import LoadingSpinner from '../common/LoadingSpinner';
import RoleBasedAccess from '../common/RoleBasedAccess';
import Modal from '../common/Modal';
import toast from 'react-hot-toast';
import ConfirmDialog from '../common/ConfirmDialog';

const ClientList = () => {
  const dispatch = useDispatch();
  const {
    clients = [], // Default to empty array
    pagination,
    filters,
    isLoading,
    error
  } = useSelector((state) => state.client);

  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [selectedStatus, setSelectedStatus] = useState(filters.status);
  const [clientToDelete, setClientToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Modal states
  const [modals, setModals] = useState({
    view: false,
    edit: false
  });
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, [dispatch, filters, pagination.currentPage]);

  const fetchClients = () => {
    const params = {
      page: pagination.currentPage,
      limit: pagination.itemsPerPage,
      search: filters.search,
      status: filters.status,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
      role: 'pet_owner'
    };
    dispatch(getClients(params));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    dispatch(setFilters({ search: searchQuery, currentPage: 1 }));
  };

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    dispatch(setFilters({ status, currentPage: 1 }));
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false);
    fetchClients();
    toast.success('Client registered successfully!');
  };

  const handleDeleteClick = (client) => {
    setClientToDelete(client);
    setShowDeleteDialog(true);
  };

  // Called when you click “Delete” in the dialog
  const confirmDelete = async () => {
    try {
      await dispatch(deleteClient(clientToDelete.id)).unwrap();
      toast.success(`"${clientToDelete.fullName}" deleted successfully`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete Client');
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handleToggleStatus = async (clientId) => {
    const client = clients.find(c => (c.id) === clientId);
    if (!client) return;

    const newStatus = !client.isActive;

    try {
      await dispatch(toggleClientStatus({
        clientId,
        isActive: newStatus
      })).unwrap();

      // Refresh the list
      dispatch(getClients());
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  // Modal functions
  const openModal = (type, client = null) => {
    setSelectedClient(client);
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
    setSelectedClient(null);
  };

  const handleViewClient = (client) => {
    openModal('view', client);
  };

  const handleEditClient = (client) => {
    openModal('edit', client);
  };

  const handleEditSuccess = () => {
    closeModal('edit');
    fetchClients();
    toast.success('Client updated successfully!');
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Error loading clients: {error}</div>
        <button
          onClick={fetchClients}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-sm text-gray-600">
              Manage your client database and registrations
            </p>
          </div>
          <RoleBasedAccess allowedRoles={['business_admin', 'staff']}>
            <button
              onClick={() => setShowRegistrationForm(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Register New Client</span>
            </button>
          </RoleBasedAccess>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : !Array.isArray(clients) || clients.length === 0 ? (
            <div className="text-center py-12">
              <UserCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by registering your first client.
              </p>
              <RoleBasedAccess allowedRoles={['business_admin', 'staff']}>
                <button
                  onClick={() => setShowRegistrationForm(true)}
                  className="mt-4 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Register New Client</span>
                </button>
              </RoleBasedAccess>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pets
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(clients) && clients.map((client) => (
                      <tr key={client._id || client.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {client.profile?.avatar ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={`http://localhost:5000${client.profile.avatar}`}
                                  alt={`http://localhost:5000${client.profile.firstName} ${client.profile.lastName}`}
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <UserCircleIcon className="h-6 w-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {client.profile?.firstName} {client.profile?.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {client.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap flex flex-col items-start">
                          <div className="text-sm text-gray-900">
                            {client.profile?.phone || 'No phone'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.profile?.address?.city && client.profile?.address?.state
                              ? `${client.profile.address.city}, ${client.profile.address.state}`
                              : 'Address not provided'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`flex items-start w-fit px-2 py-1 text-xs font-semibold rounded-full ${client.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                            }`}>
                            {client.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.pets?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(client.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <RoleBasedAccess allowedRoles={['business_admin', 'staff']}>
                            <div className="flex items-center space-x-2 justify-center">
                              <button
                                onClick={() => handleViewClient(client)}
                                className="text-indigo-600 hover:text-indigo-900 p-1"
                                title="View client"
                              >
                                <EyeIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditClient(client)}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Edit client"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(client.id)}
                                className={`${client.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                title={client.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {client.isActive ? <XMarkIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
                              </button>
                              <RoleBasedAccess allowedRoles={['business_admin']}>
                                <button
                                  onClick={() => handleDeleteClick(client)}
                                  className="text-red-600 hover:text-red-900 p-1"
                                  title="Delete client"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </RoleBasedAccess>
                            </div>
                          </RoleBasedAccess>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => dispatch(setFilters({ currentPage: pagination.currentPage - 1 }))}
                      disabled={pagination.currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => dispatch(setFilters({ currentPage: pagination.currentPage + 1 }))}
                      disabled={pagination.currentPage === pagination.totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{' '}
                        <span className="font-medium">
                          {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.totalItems}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {/* Pagination buttons would go here */}
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <ClientRegistrationForm
          onClose={() => setShowRegistrationForm(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* View Client Modal */}
      <Modal
        isOpen={modals.view}
        onClose={() => closeModal('view')}
        title="Client Details"
        size="xl"
      >
        <ClientDetails
          client={selectedClient}
          onClose={() => closeModal('view')}
          onEdit={() => {
            closeModal('view');
            openModal('edit', selectedClient);
          }}
        />
      </Modal>

      {/* Edit Client Modal */}
      <Modal
        isOpen={modals.edit}
        onClose={() => closeModal('edit')}
        title="Edit Client"
        size="xl"
      >
        <ClientForm
          client={selectedClient}
          isEdit={true}
          onSuccess={handleEditSuccess}
          onCancel={() => closeModal('edit')}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteDialog && (
        <ConfirmDialog
          title="Delete Client"
          message={`Are you sure you want to delete "${clientToDelete?.fullName}"? This action cannot be undone and will permanently remove all records for this pet.`}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false);
            setClientToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default ClientList;