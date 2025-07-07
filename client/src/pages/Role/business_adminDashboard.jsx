import React from 'react'
import StatCard from '../../components/dashboard/StatCard'

const BusinessAdminDashboard = ({ quickStats, overview, UserGroupIcon, CalendarIcon, ClockIcon, CurrencyDollarIcon, ChartBarIcon }) => {
    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Stats Grid - Better responsive layout to prevent overflow */}
            <div className="grid
            grid-cols-1        
            gap-4
            sm:grid-cols-2     
            md:grid-cols-3     
            lg:grid-cols-3     
            xl:grid-cols-3      
            2xl:grid-cols-3 ">
                <StatCard
                    title="Total Clients"
                    value={quickStats?.totalClients || overview?.overview?.totalClients || 0}
                    icon={UserGroupIcon}
                    color="primary"
                />
                <StatCard
                    title="Total Appointments"
                    value={quickStats?.totalAppointments || overview?.overview?.totalAppointments || 0}
                    icon={CalendarIcon}
                    color="blue"
                />
                <StatCard
                    title="Today's Appointments"
                    value={quickStats?.appointmentsToday || overview?.todaySchedule?.totalToday || 0}
                    icon={ClockIcon}
                    color="green"
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${(quickStats?.totalRevenue || overview?.overview?.totalRevenue || 0).toLocaleString()}`}
                    icon={CurrencyDollarIcon}
                    color="yellow"
                />
                <StatCard
                    title="Total Staff"
                    value={overview?.staffCount || overview?.staff?.length || 0}
                    icon={UserGroupIcon}
                    color="purple"
                />
                <StatCard
                    title="Total Businesses"
                    value={ overview?.businesses?.length || 0}
                    icon={ChartBarIcon}
                    color="indigo"
                />
            </div>


            {/* Today's Schedule Section */}
            {overview?.todaySchedule?.appointments && (
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    {/* Header with responsive padding */}
                    <div className="px-4 py-5 sm:px-6 lg:px-8 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900 sm:text-xl">
                                    Today's Schedule
                                </h3>
                                <p className="mt-1 text-sm text-gray-500 sm:text-base">
                                    {overview.todaySchedule.appointments.length} appointments scheduled
                                </p>
                            </div>
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
                        </div>
                    </div>

                    {/* Appointments List */}
                    <div className="bg-white">
                        {overview.todaySchedule.appointments.length > 0 ? (
                            <div className="divide-y divide-gray-200">
                                {overview.todaySchedule.appointments.map((appointment, index) => (
                                    <div
                                        key={appointment._id}
                                        className="p-4 sm:p-6 hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        {/* Mobile Layout (stacked) */}
                                        <div className="sm:hidden space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-base font-medium text-gray-900 truncate">
                                                        {appointment.client?.profile?.firstName} {appointment.client?.profile?.lastName}
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
                                                            {appointment.client?.profile?.firstName} {appointment.client?.profile?.lastName}
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

            {/* Quick Actions Grid - More responsive */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md hover:border-primary-300 transition-all duration-200 cursor-pointer group">
                    <CalendarIcon className="mx-auto h-8 w-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-medium text-gray-900">New Appointment</h3>
                    <p className="text-xs text-gray-500 mt-1">Schedule a new appointment</p>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer group">
                    <UserGroupIcon className="mx-auto h-8 w-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-medium text-gray-900">Add Client</h3>
                    <p className="text-xs text-gray-500 mt-1">Register new client</p>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md hover:border-green-300 transition-all duration-200 cursor-pointer group">
                    <ChartBarIcon className="mx-auto h-8 w-8 text-green-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-medium text-gray-900">View Reports</h3>
                    <p className="text-xs text-gray-500 mt-1">Business analytics</p>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6 text-center hover:shadow-md hover:border-yellow-300 transition-all duration-200 cursor-pointer group">
                    <CurrencyDollarIcon className="mx-auto h-8 w-8 text-yellow-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="text-sm font-medium text-gray-900">Billing</h3>
                    <p className="text-xs text-gray-500 mt-1">Manage payments</p>
                </div>
            </div>
        </div>

    )
}

export default BusinessAdminDashboard