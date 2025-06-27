import React from 'react'
import StatCard from '../../components/dashboard/StatCard';

const SuperAdminDashboard = ({ overview, UserGroupIcon, ChartBarIcon, CalendarIcon, CurrencyDollarIcon }) => {
    return (
        <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={overview?.users?.current || 0}
                    icon={UserGroupIcon}
                    color="primary"
                />
                <StatCard
                    title="Total Businesses"
                    value={overview?.totalBusinesses || 0}
                    icon={ChartBarIcon}
                    color="green"
                />
                <StatCard
                    title="Total Appointments"
                    value={overview?.totalAppointments || 0}
                    icon={CalendarIcon}
                    color="blue"
                />
                <StatCard
                    title="Total Revenue"
                    value={`$${(overview?.revenue?.current || 0).toLocaleString()}`}
                    icon={CurrencyDollarIcon}
                    color="yellow"
                />
            </div>

            {overview?.recentActivity?.businesses && (
                <div className="mt-8">
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Businesses</h3>
                        <div className="space-y-4">
                            {overview.recentActivity.businesses.map((business) => (
                                <div key={business._id} className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium text-gray-900">{business.profile.name}</p>
                                        <p className="text-sm text-gray-500">{business.profile.email}</p>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(business.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SuperAdminDashboard;
