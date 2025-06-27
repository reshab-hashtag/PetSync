import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'appointment_created':
        return '📅';
      case 'invoice_created':
        return '💰';
      case 'user_registered':
        return '👤';
      case 'business_created':
        return '🏢';
      case 'message_received':
        return '💬';
      default:
        return '📋';
    }
  };

  const getActivityText = (activity) => {
    switch (activity.type) {
      case 'appointment_created':
        return `New appointment scheduled for ${activity.data.client?.profile?.firstName || 'client'}`;
      case 'invoice_created':
        return `Invoice created for ${activity.data.client?.profile?.firstName || 'client'}`;
      case 'user_registered':
        return `New user registered: ${activity.data.profile?.firstName} ${activity.data.profile?.lastName}`;
      case 'business_created':
        return `New business created: ${activity.data.profile?.name}`;
      case 'message_received':
        return `New message from ${activity.data.from?.profile?.firstName}`;
      default:
        return 'New activity';
    }
  };

  if (activities.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <p className="text-gray-500">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, activityIdx) => (
            <li key={activity.id || activityIdx}>
              <div className="relative pb-8">
                {activityIdx !== activities.length - 1 ? (
                  <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" />
                ) : null}
                <div className="relative flex space-x-3">
                  <div>
                    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">
                      {getActivityIcon(activity.type)}
                    </span>
                  </div>
                  <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                    <div>
                      <p className="text-sm text-gray-900">{getActivityText(activity)}</p>
                    </div>
                    <div className="whitespace-nowrap text-right text-sm text-gray-500">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ActivityFeed;