import { CheckCircleIcon, ExclamationTriangleIcon, HeartIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import React from 'react';

const Header = ({ locationPermission, userLocation, handleLogin }) => {
    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <HeartIcon className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="ml-3">
                            <h1 className="text-2xl font-bold text-gray-900">PetSync</h1>
                            <p className="text-sm text-gray-500">Find the best pet services near you</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Location Status Indicator */}
                        <div className="flex items-center text-sm">
                            {locationPermission === 'granted' && userLocation ? (
                                <div className="flex items-center text-green-600">
                                    <MapPinIcon className="h-5 w-5 mr-1" />
                                </div>
                            ) : locationPermission === 'denied' ? (
                                <div className="flex items-center text-orange-600">
                                    <MapPinIcon className="h-5 w-5 mr-1" />
                                </div>
                            ) : null}
                        </div>

                        <button
                            onClick={handleLogin}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                        >
                            <UserIcon className="h-4 w-4 mr-2" />
                            Login
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
