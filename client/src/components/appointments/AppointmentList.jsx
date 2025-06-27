import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import format from 'date-fns/format';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const AppointmentList = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    date: 'all',
    search: '',
  });

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockAppointments = [
      {
        _id: '1',
        client: {
          profile: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' }
        },
        pet: {
          profile: { name: 'Buddy', species: 'Dog', breed: 'Golden Retriever' }
        },
        service: { name: 'Grooming', duration: 60, price: 50 },
        schedule: {
          startTime: new Date(2025, 5, 26, 10, 0),
          endTime: new Date(2025, 5, 26, 11, 0)
        },
        status: 'confirmed',
        notes: 'Regular grooming appointment'
      },
      {
        _id: '2',
        client: {
          profile: { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
        },
        pet: {
          profile: { name: 'Whiskers', species: 'Cat', breed: 'Persian' }
        },
        service: { name: 'Veterinary Checkup', duration: 30, price: 75 },
        schedule: {
          startTime: new Date(2025, 5, 26, 14, 30),
          endTime: new Date(2025, 5, 26, 15, 0)
        },
        status: 'pending',
        notes: 'Annual checkup'
      }
    ];
    
    setTimeout(() => {
      setAppointments(mockAppointments);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = appointments.filter(appointment => {
    if (filters.status !== 'all' && appointment.status !== filters.status) return false;
    if (filters.search && !`${appointment.client.profile.firstName} ${appointment.client.profile.lastName} ${appointment.pet.profile.name}`.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
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
          <p className="text-gray-600">Manage your scheduled appointments</p>
        </div>
        <button className="btn-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Appointment
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search appointments..."
              className="input-field"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button className="btn-secondary flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className="card">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new appointment.</p>
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
                {filteredAppointments.map((appointment) => (
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
                            {appointment.client.profile.firstName} {appointment.client.profile.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.pet.profile.name} ({appointment.pet.profile.species})
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{appointment.service.name}</div>
                      <div className="text-sm text-gray-500">
                        {appointment.service.duration} min • ${appointment.service.price}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {format(appointment.schedule.startTime, 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {format(appointment.schedule.startTime, 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-900">
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentList;