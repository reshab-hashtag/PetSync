import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayCircleIcon,
  PauseCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
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
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

const AppointmentList = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { 
    appointments, 
    pagination, 
    filters, 
    stats,
    isLoading, 
    error 
  } = useSelector((state) => state.appointments);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (user) {
      dispatch(fetchAppointments(filters));
      dispatch(fetchAppointmentStats());
    }
  }, [dispatch, user, filters]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled':
        return <CalendarIcon className="h-4 w-4" />;
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
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
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center"
          >
            <FunnelIcon className="h-5 w-5 mr-2" />
            Filters
          </button>
          {(user?.role === 'business_admin' || user?.role === 'staff') && (
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

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
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
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
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
          <div className="bg-white p-6 rounded-lg shadow-sm border">
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
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search appointments..."
                className="input-field pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
              />
            </div>
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => handleFilterChange({ status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
            <input
              type="date"
              className="input-field"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
              placeholder="From Date"
            />
            <div className="flex space-x-2">
              <input
                type="date"
                className="input-field"
                value={filters.dateTo}
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
      <div className="card">
        {appointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'business_admin' || user?.role === 'staff' 
                ? 'Get started by creating a new appointment.' 
                : 'No appointments found matching your criteria.'}
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
          <div className="overflow-hidden">
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {appointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-gray-500" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.client?.profile?.firstName} {appointment.client?.profile?.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.pet?.profile?.name} ({appointment.pet?.profile?.species})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.service?.name}</div>
                      <div className="text-sm text-gray-500">
                        {appointment.service?.duration} min • {formatCurrency(appointment.service?.price?.amount || 0)}
                      </div>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {formatDate(appointment.schedule?.startTime)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {formatTime(appointment.schedule?.startTime)}
                      </div>
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1">{appointment.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedAppointment(appointment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        {canUpdateStatus(appointment) && (
                          <>
                            {appointment.status === 'scheduled' && (
                              <button
                                onClick={() => handleStatusUpdate(appointment._id, 'checkin')}
                                className="text-green-600 hover:text-green-900"
                                title="Check In"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                            {appointment.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusUpdate(appointment._id, 'start')}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Start Service"
                              >
                                <PlayCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                            {appointment.status === 'in_progress' && (
                              <button
                                onClick={() => handleStatusUpdate(appointment._id, 'complete')}
                                className="text-emerald-600 hover:text-emerald-900"
                                title="Complete Service"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                            {['scheduled', 'confirmed'].includes(appointment.status) && (
                              <button
                                onClick={() => handleCancelAppointment(appointment._id, 'Cancelled by admin')}
                                className="text-red-600 hover:text-red-900"
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleFilterChange({ page: pagination.current - 1 })}
              disabled={pagination.current === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handleFilterChange({ page: pagination.current + 1 })}
              disabled={pagination.current === pagination.pages}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Appointment Modal */}
      <AppointmentCreateForm
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default AppointmentList;