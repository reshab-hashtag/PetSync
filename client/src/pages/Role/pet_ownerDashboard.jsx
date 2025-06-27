import React from 'react';
import StatCard from '../../components/dashboard/StatCard';

const PetOwnerDashboard = ({ overview, UserGroupIcon, CalendarIcon, ChartBarIcon, CurrencyDollarIcon }) => {
    return (
        <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="My Pets"
                    value={overview?.overview?.totalPets || 0}
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

            {overview?.upcomingAppointments && overview.upcomingAppointments.length > 0 && (
                <div className="mt-8">
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Appointments</h3>
                        <div className="space-y-4">
                            {overview.upcomingAppointments.map((appointment) => (
                                <div key={appointment._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {appointment.pet?.profile?.name} ({appointment.pet?.profile?.species})
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {appointment.service?.name} - {appointment.business?.profile?.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(appointment.schedule.startTime).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(appointment.schedule.startTime).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {overview?.pets && overview.pets.length > 0 && (
                <div className="mt-8">
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">My Pets</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {overview.pets.map((pet) => (
                                <div key={pet._id} className="p-4 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                <span className="text-blue-600 font-medium">
                                                    {pet.profile?.name?.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{pet.profile?.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {pet.profile?.species} • {pet.profile?.breed}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PetOwnerDashboard;
