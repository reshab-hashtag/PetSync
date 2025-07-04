// client/src/components/clients/ClientList.jsx (Updated with registration button)

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { getClients, deleteClient, toggleClientStatus, setFilters } from '../../store/slices/clientSlice';
import ClientRegistrationForm from './ClientRegistrationForm';
import LoadingSpinner from '../common/LoadingSpinner';
import RoleBasedAccess from '../common/RoleBasedAccess';

const ClientList = () => {
  const dispatch = useDispatch();
  const { 
    clients = [], // Default to empty array
    pagination, 
    filters, 
    isLoading, 
    error 
  } = useSelector((state) => state.client);
  const { user } = useSelector((state) => state.auth);

  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search);
  const [selectedStatus, setSelectedStatus] = useState(filters.status);

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
      role: 'pet_owner' // Only fetch pet owners (clients)
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

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      try {
        await dispatch(deleteClient(clientId)).unwrap();
        fetchClients(); // Refresh the list
      } catch (error) {
        console.error('Error deleting client:', error);
      }
    }
  };

  const handleToggleStatus = async (clientId) => {
    try {
      await dispatch(toggleClientStatus(clientId)).unwrap();
      fetchClients(); // Refresh the list
    } catch (error) {
      console.error('Error toggling client status:', error);
    }
  };

  const handleRegistrationSuccess = () => {
    setShowRegistrationForm(false);
    fetchClients(); // Refresh the list
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">Manage your pet owner clients</p>
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
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search clients..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Status Filter */}
          <div className="flex space-x-2">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedStatus === status
                    ? 'bg-primary-100 text-primary-700 border border-primary-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

              {/* Clients Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!Array.isArray(clients) || clients.length === 0 ? (
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pets
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
                  {Array.isArray(clients) && clients.map((client) => (
                    <tr key={client._id || client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {client.profile?.avatar ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={client.profile.avatar}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <UserCircleIcon className="h-6 w-6 text-gray-600" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {client.fullName || `${client.profile?.firstName} ${client.profile?.lastName}`}
                            </div>
                            <div className="text-sm text-gray-500">
                              {client.profile?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client.profile?.phone || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {client.profile?.address?.city && client.profile?.address?.state
                            ? `${client.profile.address.city}, ${client.profile.address.state}`
                            : 'Address not provided'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.isActive
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
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {/* Handle view client */}}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="View client"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {/* Handle edit client */}}
                              className="text-blue-600 hover:text-blue-900 p-1"
                              title="Edit client"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(client._id || client.id)}
                              className={`p-1 ${
                                client.isActive 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                              title={client.isActive ? 'Deactivate client' : 'Activate client'}
                            >
                              {client.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <RoleBasedAccess allowedRoles={['business_admin']}>
                              <button
                                onClick={() => handleDeleteClient(client._id || client.id)}
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

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <ClientRegistrationForm
          onClose={() => setShowRegistrationForm(false)}
          onSuccess={handleRegistrationSuccess}
        />
      )}
    </div>
  );
};

export default ClientList;