import React from 'react';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-100',
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    red: 'text-red-600 bg-red-100',
  };

  return (
    <div className="card">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↗' : '↘'} {trendValue}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;