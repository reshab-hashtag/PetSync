import { MapPinIcon, PhoneIcon, StarIcon } from '@heroicons/react/24/outline';
import React from 'react';

const RenderBusinessCard = ({ business, handleContactBusiness }) => {
    return (
        <div key={business._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
            <div className="relative">
                <img
                    src={business.profile?.logo || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'}
                    alt={business.profile?.name || business.name}
                    className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium">
                    {business.distance ? `${business.distance}km` : 'Nearby'}
                </div>
            </div>

            <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xl font-bold text-gray-900">
                        {business.profile?.name || business.name}
                    </h4>
                    <div className="flex items-center">
                        <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm font-medium text-gray-700">
                            {business.rating || '4.5'}
                        </span>
                        <span className="ml-1 text-sm text-gray-500">
                            ({business.reviewCount || '0'})
                        </span>
                    </div>
                </div>

                <div className="flex items-center text-gray-600 mb-3">
                    <MapPinIcon className="h-4 w-4 mr-2" />
                    <span className="text-sm">
                        {business.profile?.address ?
                            `${business.profile.address.street}, ${business.profile.address.city}` :
                            'Address not available'
                        }
                    </span>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                    {business.services?.slice(0, 3).map((service, index) => (
                        <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                        >
                            {service.name}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        <span className="text-sm">
                            {business.profile?.phone || 'Contact for details'}
                        </span>
                    </div>
                    <button
                        onClick={() => handleContactBusiness(business)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Contact
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RenderBusinessCard;
