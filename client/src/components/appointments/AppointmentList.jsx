import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import {
  fetchAppointments,
  setFilters,
  clearFilters,
  cancelAppointment,
  updateAppointmentStatus,
  fetchAppointmentStats
} from '../../store/slices/appointmentSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import AppointmentCreateForm from './AppointmentCreateForm';
import AppointmentDetailsModal from './AppointmentDetailsModal';

const AppointmentList = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const {
    appointments,
    pagination,
    filters,
    stats,
    isLoading,
  } = useSelector((state) => state.appointments);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    page: 1
  });

  const { role } = user;

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery !== localFilters.search) {
        setLocalFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, localFilters.search]);

  // Apply filters when localFilters change
  useEffect(() => {
    dispatch(setFilters(localFilters));
  }, [localFilters, dispatch]);

  useEffect(() => {
    if (user) {
      dispatch(fetchAppointments(filters));
      dispatch(fetchAppointmentStats());
    }
  }, [dispatch, user, filters]);

  // Update local search when filters change externally
  useEffect(() => {
    if (filters.search !== searchQuery) {
      setSearchQuery(filters.search || '');
    }
  }, [filters.search]);

  const handleFilterChange = (newFilters) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocalFilters({
      search: '',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      page: 1
    });
    dispatch(clearFilters());
  };

  const handlePageChange = (page) => {
    setLocalFilters(prev => ({ ...prev, page }));
  };

  const handleCreateSuccess = () => {
    dispatch(fetchAppointments(filters));
    dispatch(fetchAppointmentStats());
  };

  const handleStatusUpdate = async (appointmentId, status, data = {}) => {
    try {
      await dispatch(updateAppointmentStatus({ appointmentId, status, data })).unwrap();
      dispatch(fetchAppointments(filters));
      dispatch(fetchAppointmentStats());
    } catch (error) {
      console.error('Failed to update appointment status:', error);
    }
  };

  const handleCancelAppointment = async (appointmentId, reason) => {
    try {
      await dispatch(cancelAppointment({ appointmentId, reason })).unwrap();
      dispatch(fetchAppointments(filters));
      dispatch(fetchAppointmentStats());
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  // Add handler for viewing appointment details
  const handleViewAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  // Enhanced status functions to include staff assignment pending
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
        return <CalendarIcon className="h-4 w-4" />;
      case 'staff_assignment_pending':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'in_progress':
        return <PlayCircleIcon className="h-4 w-4" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      case 'no_show':
        return <PauseCircleIcon className="h-4 w-4" />;
      default:
        return <ClockIcon className="h-4 w-4" />;
    }
  };

  // Enhanced status text formatting
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
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canUpdateStatus = (appointment) => {
    return user?.role === 'business_admin' ||
      (user?.role === 'staff' && appointment.staff?.assigned === user._id);
  };

  if (isLoading && appointments.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="text-gray-600">
              Manage your scheduled appointments
              {user?.role === 'business_admin' && stats.totalAppointments > 0 && (
                <span className="ml-2 text-sm font-medium text-blue-600">
                  ({stats.totalAppointments} total created)
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
            {(user?.role === 'business_admin' || user?.role === 'staff' || user?.role === 'client') && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Appointment
              </button>
            )}
          </div>
        </div>

        {/* Staff Assignment Pending Alert for Business Admins */}
        {user?.role === 'business_admin' && appointments.some(apt => apt.status === 'staff_assignment_pending') && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-600 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-orange-800">Staff Assignment Required</h3>
                  <p className="text-xs text-orange-600">
                    {appointments.filter(a => a.status === 'staff_assignment_pending').length} appointments need staff assignment
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleFilterChange({ status: 'staff_assignment_pending' })}
                className="text-xs bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700"
              >
                View Pending
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalAppointments}</p>
                </div>
              </div>
            </div>

            {role === "business_admin" && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-8 w-8 text-emerald-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byStatus?.completed || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Scheduled</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byStatus?.scheduled || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by client, pet, or service..."
                  className="input-field pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="input-field"
                value={localFilters.status}
                onChange={(e) => handleFilterChange({ status: e.target.value })}
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="staff_assignment_pending">Staff Assignment Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No Show</option>
              </select>

              <input
                type="date"
                className="input-field"
                value={localFilters.dateFrom}
                onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                placeholder="From Date"
              />

              <div className="flex space-x-2">
                <input
                  type="date"
                  className="input-field flex-1"
                  value={localFilters.dateTo}
                  onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                  placeholder="To Date"
                />
                <button
                  onClick={handleClearFilters}
                  className="btn-secondary whitespace-nowrap"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery || localFilters.status !== 'all' || localFilters.dateFrom || localFilters.dateTo
                  ? 'No appointments found matching your criteria.'
                  : user?.role === 'business_admin' || user?.role === 'staff'
                    ? 'Get started by creating a new appointment.'
                    : 'No appointments scheduled yet.'}
              </p>
              {(user?.role === 'business_admin' || user?.role === 'staff') && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="btn-primary"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create New Appointment
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client & Pet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {user?.role === 'business_admin' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Business
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((appointment) => (
                    <tr key={appointment._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.role === 'client' ? (
                                <>You</>
                              ) : (
                                <>{appointment.client?.profile?.firstName} {appointment.client?.profile?.lastName}</>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {appointment.pet?.profile?.name} • {appointment.pet?.profile?.species}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 w-fit">{appointment.service?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-2">
                          <span className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {appointment.service?.duration || appointment.duration || 'N/A'} min
                          </span>
                          <span className="flex items-center">
                            <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                            {formatCurrency(appointment.service?.price?.amount || appointment.price || 0)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          <div className=''>
                            <div className="font-medium w-fit">{formatDate(appointment.schedule?.startTime || appointment.date)}</div>
                            <div className="text-gray-500 w-fit">{formatTime(appointment.schedule?.startTime || appointment.startTime)}</div>
                          </div>
                        </div>
                      </td>

                      {/* Enhanced Staff Column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.status === 'staff_assignment_pending' ? (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                                <ExclamationTriangleIcon className="h-4 w-4 text-orange-600" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <span className="text-sm font-medium text-orange-700">Assignment Pending</span>
                            </div>
                          </div>
                        ) : appointment.staff?.assigned ? (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                                <UserGroupIcon className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                            <div className="ml-3 flex flex-col items-start">
                              <div className="text-sm font-medium text-gray-900">
                                {appointment.staff.assigned.profile?.firstName} {appointment.staff.assigned.profile?.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {appointment.staff.assigned.profile?.email}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <UserGroupIcon className="h-4 w-4 text-gray-400" />
                              </div>
                            </div>
                            <div className="ml-3">
                              <span className="text-sm text-gray-500">Not assigned</span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`flex items-start w-fit px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                          {getStatusIcon(appointment.status)}
                          <span className="ml-1">{getStatusText(appointment.status)}</span>
                        </span>
                      </td>

                      {user?.role === 'business_admin' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-900">
                            <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                            <div className='flex flex-col items-start'>
                              <div className="font-medium">{appointment.business?.profile?.name || 'N/A'}</div>
                              <div className="text-gray-500">{appointment.business?.profile?.address?.city || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                      )}

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* View Details Button */}
                          <button
                            onClick={() => handleViewAppointment(appointment)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>

                          {canUpdateStatus(appointment) && (
                            <>
                              {appointment.status === 'scheduled' && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, 'checkin')}
                                  className="text-green-600 hover:text-green-900 p-1 rounded-md hover:bg-green-50 transition-colors"
                                  title="Check In"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}

                              {appointment.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, 'start')}
                                  className="text-yellow-600 hover:text-yellow-900 p-1 rounded-md hover:bg-yellow-50 transition-colors"
                                  title="Start Service"
                                >
                                  <PlayCircleIcon className="h-4 w-4" />
                                </button>
                              )}

                              {appointment.status === 'in_progress' && (
                                <button
                                  onClick={() => handleStatusUpdate(appointment._id, 'complete')}
                                  className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-50 transition-colors"
                                  title="Complete Service"
                                >
                                  <CheckCircleIcon className="h-4 w-4" />
                                </button>
                              )}

                              {['scheduled', 'confirmed'].includes(appointment.status) && (
                                <button
                                  onClick={() => handleCancelAppointment(appointment._id, 'Cancelled by admin')}
                                  className="text-red-600 hover:text-red-900 p-1 rounded-md hover:bg-red-50 transition-colors"
                                  title="Cancel Appointment"
                                >
                                  <XCircleIcon className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.current - 1)}
                disabled={pagination.current === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(pagination.current - 2, pagination.pages - 4)) + i;
                  return pageNum <= pagination.pages ? (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm rounded-md ${pageNum === pagination.current
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ) : null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(pagination.current + 1)}
                disabled={pagination.current === pagination.pages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Appointment Modal */}
      <AppointmentCreateForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedAppointment(null);
        }}
        appointment={selectedAppointment}
      />
    </div>
  );
};

export default AppointmentList;