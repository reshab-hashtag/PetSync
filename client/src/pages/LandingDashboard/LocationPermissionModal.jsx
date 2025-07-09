import { MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

const LocationPermissionModal = ({
    showLocationModal,
    setShowLocationModal,
    skipLocationPermission,
    requestLocationPermission
}) => {
    return (
        <div>
            {showLocationModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Enable Location</h3>
                            <button
                                onClick={() => setShowLocationModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="text-center mb-6">
                            <MapPinIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                            <p className="text-gray-600 mb-4">
                                To show you the most relevant pet services, we'd like to access your location.
                                This helps us find businesses near you and show accurate distances.
                            </p>
                            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                                <strong>Why we need location:</strong>
                                <ul className="mt-2 list-disc list-inside text-left">
                                    <li>Find nearby pet services</li>
                                    <li>Show accurate distances</li>
                                    <li>Prioritize local businesses</li>
                                    <li>Faster service recommendations</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={skipLocationPermission}
                                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Skip for now
                            </button>
                            <button
                                onClick={requestLocationPermission}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Enable Location
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationPermissionModal;
