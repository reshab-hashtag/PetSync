import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData, fetchQuickStats, fetchRecentActivity } from '../store/slices/dashboardSlice';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
    UserGroupIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    ClockIcon,
} from '@heroicons/react/24/outline';
import SuperAdminDashboard from './Role/super_adminDashboard';
import BusinessAdminDashboard from './Role/business_adminDashboard';
import StaffDashboard from './Role/staffDashboard';
import ClientDashboard from './Role/clientDashboard';
import DefaultDashboard from './Role/defaultDashboard';

const Dashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { overview, recentActivity, isLoading } = useSelector((state) => state.dashboard);
    useEffect(() => {
        dispatch(fetchDashboardData());
        dispatch(fetchQuickStats());
        dispatch(fetchRecentActivity(10));
    }, [dispatch]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // Render different dashboard based on user role
    const renderDashboardByRole = () => {
        switch (user?.role) {
            case 'super_admin':
                return <SuperAdminDashboard
                    overview={overview}
                    UserGroupIcon={UserGroupIcon}
                    ChartBarIcon={ChartBarIcon}
                    CalendarIcon={CalendarIcon}
                    CurrencyDollarIcon={CurrencyDollarIcon}
                />;
            case 'business_admin':
                return <BusinessAdminDashboard
                    quickStats
                    overview={overview}
                    UserGroupIcon={UserGroupIcon}
                    CalendarIcon={CalendarIcon}
                    ClockIcon={ClockIcon}
                    CurrencyDollarIcon={CurrencyDollarIcon}
                    ChartBarIcon={ChartBarIcon}
                />;
            case 'staff':
                return <StaffDashboard
                    overview={overview}
                    CalendarIcon={CalendarIcon}
                    ClockIcon={ClockIcon}
                    ChartBarIcon={ChartBarIcon}
                    CurrencyDollarIcon={CurrencyDollarIcon}
                />;
            case 'client':
                return <ClientDashboard
                    overview={overview}
                    UserGroupIcon={UserGroupIcon}
                    CalendarIcon={CalendarIcon}
                    ChartBarIcon={ChartBarIcon}
                    CurrencyDollarIcon={CurrencyDollarIcon}
                />
            default:
                return <DefaultDashboard />
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Welcome back, {user?.profile?.firstName || 'User'}!
                    </h1>
                    <p className="text-gray-600">
                        Here's what's happening with your {user?.role === 'client' ? 'pets' : 'business'} today.
                    </p>
                </div>
            </div>

            {renderDashboardByRole()}

            {recentActivity && recentActivity.length > 0 && (
                <div className="mt-8">
                    <div className="card">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                        <ActivityFeed activities={recentActivity} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;