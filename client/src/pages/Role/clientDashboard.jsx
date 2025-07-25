import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getPets } from '../../store/slices/petSlice';
import StatCard from '../../components/dashboard/StatCard';
import { fetchAppointments } from '../../store/slices/appointmentSlice';
import { ClockIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const ClientDashboard = ({ overview, UserGroupIcon, CalendarIcon, ChartBarIcon, CurrencyDollarIcon }) => {
    const { pets } = useSelector((state) => state.pets);
    const { appointments, isLoading: appointmentsLoading } = useSelector((state) => state.appointments);
    const [showCreateAppointment, setShowCreateAppointment] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    useEffect(() => {
        dispatch(getPets());
        dispatch(fetchAppointments());
    }, [dispatch]);


    // Filter today's appointments from Redux store
    const todaysAppointments = useMemo(() => {
        if (!appointments || appointments.length === 0) return [];

        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

        return appointments.filter(appointment => {
            // Check if appointment is for today
            let appointmentDate;

            // Handle different date formats
            if (appointment.schedule?.date) {
                appointmentDate = new Date(appointment.schedule.date).toISOString().split('T')[0];
            } else if (appointment.schedule?.startTime) {
                appointmentDate = new Date(appointment.schedule.startTime).toISOString().split('T')[0];
            } else if (appointment.date) {
                appointmentDate = new Date(appointment.date).toISOString().split('T')[0];
            }

            return appointmentDate === todayDateString;
        }).sort((a, b) => {
            // Sort by start time
            const timeA = new Date(a.schedule?.startTime || a.startTime);
            const timeB = new Date(b.schedule?.startTime || b.startTime);
            return timeA - timeB;
        });
    }, [appointments]);

    // Handle view today's appointments (you can implement navigation logic)
    const handleViewTodaysAppointments = () => {
        navigate('/dashboard/appointments');
    };
    return (
        <div className="space-y-6 lg:space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="My Pets"
                    value={pets.length || 0}
                    icon={UserGroupIcon}
                    color="primary"
                />
                <StatCard
                    title="Upcoming Appointments"
                    value={overview?.overview?.upcomingAppointments || 0}
                    icon={CalendarIcon}
                    color="blue"
                />
                <StatCard
                    title="Completed Appointments"
                    value={overview?.overview?.completedAppointments || 0}
                    icon={ChartBarIcon}
                    color="green"
                />
                <StatCard
                    title="Total Spent"
                    value={`$${(overview?.overview?.totalSpent || 0).toLocaleString()}`}
                    icon={CurrencyDollarIcon}
                    color="yellow"
                />
            </div>

            {/* Today's Schedule Section - Now using Redux data */}

            {(todaysAppointments.length > 0 || appointmentsLoading) && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    {/* Header with responsive padding */}
                    <div className="px-4 py-5 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900 sm:text-xl">
                                    Today's Schedule
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                                    {appointmentsLoading ? 'Loading...' : `${todaysAppointments.length} appointments scheduled`}
                                </p>
                            </div>
                            <div className="flex items-center space-x-3 justify-between">
                                <div className="flex-shrink-0">
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 sm:text-sm">
                                        {new Date().toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                {/* View All Button */}
                                <button
                                    onClick={handleViewTodaysAppointments}
                                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                                >
                                    View All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Appointments List */}
                    <div className="bg-white">
                        {appointmentsLoading ? (
                            /* Loading State */
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                                <p className="mt-2 text-sm text-gray-500">Loading today's appointments...</p>
                            </div>
                        ) : todaysAppointments.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {todaysAppointments.map((appointment, index) => (
                                    <div
                                        key={appointment._id}
                                        className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        {/* Mobile Layout (stacked) */}
                                        <div className="sm:hidden space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex min-w-0 flex-col items-start">
                                                    <h4 className="text-base font-medium text-gray-900 truncate">
                                                        {/* {appointment.client?.profile?.firstName} {appointment.client?.profile?.lastName} */}
                                                        You
                                                    </h4>
                                                    <p className="mt-1 text-sm text-gray-600 truncate">
                                                        {appointment.pet?.profile?.name} • {appointment.service?.name}
                                                    </p>
                                                </div>
                                                <div className="flex-shrink-0 ml-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {appointment.status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="font-medium text-gray-900">
                                                    {new Date(appointment.schedule.startTime).toLocaleTimeString('en-US', {
                                                        hour: 'numeric',
                                                        minute: '2-digit',
                                                        hour12: true
                                                    })}
                                                </span>
                                                {appointment.service?.duration && (
                                                    <span className="text-gray-500">
                                                        {appointment.service.duration} min
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Desktop Layout (side by side) */}
                                        <div className="hidden sm:flex sm:items-center sm:justify-between">
                                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                                {/* Client Avatar Placeholder */}
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                                                        <span className="text-white font-medium text-sm">
                                                            {appointment.client?.profile?.firstName?.charAt(0)}
                                                            {appointment.client?.profile?.lastName?.charAt(0)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Appointment Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-3">
                                                        <h4 className="text-sm font-medium text-gray-900 truncate">
                                                            {/* {appointment.client?.profile?.firstName} {appointment.client?.profile?.lastName} */}
                                                            You
                                                        </h4>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {appointment.status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                                                        <span className="truncate">{appointment.pet?.profile?.name}</span>
                                                        <span>•</span>
                                                        <span className="truncate">{appointment.service?.name}</span>
                                                        {appointment.service?.duration && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{appointment.service.duration} min</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Time and Actions */}
                                            <div className="flex items-center space-x-4 flex-shrink-0">
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {new Date(appointment.schedule.startTime).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        })}
                                                    </p>
                                                    {appointment.schedule.endTime && (
                                                        <p className="text-xs text-gray-500">
                                                            - {new Date(appointment.schedule.endTime).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Quick Actions */}
                                                <div className="flex space-x-1">
                                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                                                        <CalendarIcon className="h-4 w-4" />
                                                    </button>
                                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                                                        <ClockIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* Empty State */
                            <div className="text-center py-12">
                                <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments today</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Your schedule is clear for today. Time to catch up on other tasks!
                                </p>
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateAppointment(true)}
                                        className="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
                                    >
                                        <CalendarIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                                        Schedule Appointment
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
