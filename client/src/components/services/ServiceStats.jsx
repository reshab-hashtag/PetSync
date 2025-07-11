import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServiceStats } from '../../store/slices/serviceSlice';
import {
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import StatCard from '../dashboard/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';

const ServiceStats = ({ className = '' }) => {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.services);

  useEffect(() => {
    dispatch(fetchServiceStats());
  }, [dispatch]);

  if (loading.stats) {
    return (
      <div className={`flex justify-center items-center h-32 ${className}`}>
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Services"
          value={stats.totalServices || 0}
          icon={WrenchScrewdriverIcon}
          color="primary"
        />
        <StatCard
          title="Active Services"
          value={stats.activeServices || 0}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatCard
          title="Inactive Services"
          value={stats.inactiveServices || 0}
          icon={XCircleIcon}
          color="red"
        />
        <StatCard
          title="Categories"
          value={stats.categoryStats?.length || 0}
          icon={ChartBarIcon}
          color="blue"
        />
      </div>

      {/* Category Breakdown */}
      {stats.categoryStats && stats.categoryStats.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Services by Category</h3>
          <div className="space-y-3">
            {stats.categoryStats.map((category) => (
              <div key={category._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {category._id || 'Other'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {category.count} service{category.count !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Avg: ₹{category.averagePrice?.toFixed(2) || '0.00'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {category.averageDuration?.toFixed(0) || '0'} min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceStats;