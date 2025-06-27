import React from 'react';
import StatCard from '../../components/dashboard/StatCard';

const StaffDashboard = ({ overview, CalendarIcon, ClockIcon, ChartBarIcon, CurrencyDollarIcon }) => {
    return (
        <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Today's Appointments"
                    value={overview?.overview?.appointmentsToday || 0}
                    icon={CalendarIcon}
                    color="primary"
                />
                <StatCard
                    title="Upcoming Appointments"
                    value={overview?.overview?.upcomingAppointments || 0}
                    icon={ClockIcon}
                    color="blue"
                />
                <StatCard
                    title="Completed This Month"
                    value={overview?.overview?.completedAppointments || 0}
                    icon={ChartBarIcon}
                    color="green"
                />
                <StatCard
                    title="Revenue Generated"
                    value={`$${(overview?.overview?.totalRevenue || 0).toLocaleString()}`}
                    icon={CurrencyDollarIcon}
                    color="yellow"
                />
            </div>

            {overview?.todaySchedule?.appointments && (
                <div className="mt-8">
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">My Schedule Today</h3>
                        {overview.todaySchedule.appointments.length > 0 ? (
                            <div className="space-y-4">
                                {overview.todaySchedule.appointments.map((appointment) => (
                                    <div key={appointment._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {appointment.client?.profile?.firstName} {appointment.client?.profile?.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {appointment.pet?.profile?.name} ({appointment.pet?.profile?.species}) - {appointment.service?.name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(appointment.schedule.startTime).toLocaleTimeString()}
                                            </p>
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {appointment.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No appointments scheduled for today</p>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default StaffDashboard;
