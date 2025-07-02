// client/src/components/business/BusinessList.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  UserGroupIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { fetchBusinesses } from '../../store/slices/businessSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import BusinessDetails from './BusinessDetails';
import BusinessForm from './BusinessForm';
import toast from 'react-hot-toast';

const BusinessList = () => {
  const dispatch = useDispatch();
  const { businesses, loading, pagination } = useSelector(state => state.business);
  const { user } = useSelector(state => state.auth);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    page: 1
  });

  const [modals, setModals] = useState({
    details: false,
    create: false
  });

  const [selectedBusiness, setSelectedBusiness] = useState(null);

  useEffect(() => {
    dispatch(fetchBusinesses(filters));
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

  const openModal = (type, business = null) => {
    setSelectedBusiness(business);
    setModals(prev => ({ ...prev, [type]: true }));
  };

  const closeModal = (type) => {
    setModals(prev => ({ ...prev, [type]: false }));
    setSelectedBusiness(null);
  };

  const handleViewDetails = (business) => {
    openModal('details', business);
  };

  const handleCreateBusiness = () => {
    openModal('create');
  };

  const getStatusBadge = (isActive) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const getSubscriptionBadge = (subscription) => {
    const styles = {
      free: 'bg-gray-100 text-gray-800',
      basic: 'bg-blue-100 text-blue-800',
      premium: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[subscription?.plan] || styles.free}`}>
        {subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1) || 'Free'}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  // Check if user can create businesses
  const canCreateBusiness = user?.role === 'business_admin' || user?.role === 'super_admin';

  if (loading && !businesses.length) {
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
          <h1 className="text-2xl font-bold text-gray-900">Business Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'super_admin' 
              ? 'Manage all businesses in the system'
              : 'View and manage your business information'
            }
          </p>
        </div>
        {canCreateBusiness && (
          <button
            onClick={handleCreateBusiness}
            className="btn-primary inline-flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Business
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search businesses..."
              className="input-field pl-10"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          
          {user?.role === 'super_admin' && (
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          )}

          <div className="text-sm text-gray-500 flex items-center">
            Total: {pagination?.total || 0} businesses
          </div>
        </div>
      </div>

      {/* Business Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {businesses.map((business) => (
          <div
            key={business._id}
            className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200"
          >
            {/* Business Header */}
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {business.profile.name}
                    </h3>
                    {/* Display company name if different from business name */}
                    {business.profile.companyName && 
                     business.profile.companyName !== business.profile.name && (
                      <p className="text-sm text-gray-600 truncate" title={business.profile.companyName}>
                        {business.profile.companyName}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-1">
                      {getStatusBadge(business.isActive)}
                      {getSubscriptionBadge(business.subscription)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleViewDetails(business)}
                  className="text-indigo-600 hover:text-indigo-900 ml-2"
                  title="View Details"
                >
                  <EyeIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Business Info */}
              <div className="mt-4 space-y-2">
                {business.profile.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{business.profile.email}</span>
                  </div>
                )}
                {business.profile.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{business.profile.phone}</span>
                  </div>
                )}
                {business.profile.address?.city && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">
                      {business.profile.address.city}, {business.profile.address.state}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              {business.profile.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                  {business.profile.description}
                </p>
              )}
            </div>

            {/* Business Stats */}
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <UserGroupIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm font-medium text-gray-900">
                      {business.stats?.activeStaff || business.staff?.length || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Staff</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm font-medium text-gray-900">
                      {business.metrics?.totalAppointments || 0}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Appointments</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center">
                    <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-sm font-medium text-gray-900">
                      {business.metrics?.totalRevenue ? 
                        formatCurrency(business.metrics.totalRevenue).replace('₹', '') : '0'
                      }
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Revenue</p>
                </div>
              </div>
            </div>

            {/* Services */}
            {business.services && business.services.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-4">
                <p className="text-xs text-gray-500 mb-2">Services</p>
                <div className="flex flex-wrap gap-1">
                  {business.services.slice(0, 3).map((service, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {service.name}
                    </span>
                  ))}
                  {business.services.length > 3 && (
                    <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      +{business.services.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Company Name Section (if it's the same as business name, show it here) */}
            {business.profile.companyName && 
             business.profile.companyName === business.profile.name && (
              <div className="border-t border-gray-200 px-6 py-3">
                <div className="flex items-center text-xs text-gray-500">
                  <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                  <span className="font-medium">Legal Name:</span>
                  <span className="ml-1 truncate">{business.profile.companyName}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {businesses.length === 0 && !loading && (
        <div className="text-center py-12">
          <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No businesses found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search 
              ? 'Try adjusting your search criteria.'
              : canCreateBusiness 
                ? 'Get started by creating your first business.'
                : 'No businesses are available to display.'
            }
          </p>
          {canCreateBusiness && !filters.search && (
            <div className="mt-6">
              <button
                onClick={handleCreateBusiness}
                className="btn-primary inline-flex items-center"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Business
              </button>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg">
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
                {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                  const page = i + 1;
                  return (
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
                  );
                })}
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

      {/* Business Details Modal */}
      <Modal
        isOpen={modals.details}
        onClose={() => closeModal('details')}
        title={`${selectedBusiness?.profile.name}${selectedBusiness?.profile.companyName && selectedBusiness?.profile.companyName !== selectedBusiness?.profile.name ? ` (${selectedBusiness.profile.companyName})` : ''}`}
        size="xl"
      >
        {selectedBusiness && (
          <BusinessDetails
            business={selectedBusiness}
            onClose={() => closeModal('details')}
          />
        )}
      </Modal>

      {/* Create Business Modal */}
      <Modal
        isOpen={modals.create}
        onClose={() => closeModal('create')}
        title="Create New Business"
        size="xl"
      >
        <BusinessForm
          onSuccess={() => {
            closeModal('create');
            dispatch(fetchBusinesses(filters));
            toast.success('Business created successfully!');
          }}
          onCancel={() => closeModal('create')}
        />
      </Modal>
    </div>
  );
};

export default BusinessList;