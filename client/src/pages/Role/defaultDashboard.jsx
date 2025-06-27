import { DocumentTextIcon } from '@heroicons/react/24/outline';
import React from 'react';

const DefaultDashboard = () => {
    return (
        <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No dashboard available</h3>
            <p className="mt-1 text-sm text-gray-500">
                Your account doesn't have access to dashboard features.
            </p>
        </div>
    );
};

export default DefaultDashboard;
