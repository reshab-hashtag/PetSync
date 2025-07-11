// client/src/components/common/ConfirmDialog.jsx
import React from 'react';
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const ConfirmDialog = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  isLoading = false
}) => {
  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />;
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-600" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-600" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />;
    }
  };

  const getButtonStyles = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
      default:
        return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {title}
            </h3>
            <div className="mt-2 px-7 py-3">
              <p className="text-sm text-gray-500">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-3 mt-6">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()}`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmDialog;