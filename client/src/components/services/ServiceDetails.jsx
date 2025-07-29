// client/src/components/services/ServiceDetails.jsx
import React from 'react';
import {
  XMarkIcon,
  PencilIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const ServiceDetails = ({ service, onClose, onEdit }) => {
  if (!service) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">{service.name}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={onEdit}
              className="text-primary-600 hover:text-primary-500 p-2 rounded-md border border-primary-200 hover:border-primary-300"
              title="Edit Service"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              service.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {service.isActive ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Active
                </>
              ) : (
                <>
                  <XCircleIcon className="h-4 w-4 mr-1" />
                  Inactive
                </>
              )}
            </span>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <TagIcon className="h-5 w-5 mr-2 text-gray-500" />
              Basic Information
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Category</span>
                <p className="mt-1 text-sm text-gray-900 capitalize">{service.category}</p>
              </div>
              
              {service.description && (
                <div className="md:col-span-2">
                  <span className="text-sm font-medium text-gray-500">Description</span>
                  <p className="mt-1 text-sm text-gray-900">{service.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <CurrencyDollarIcon className="h-5 w-5 mr-2 text-gray-500" />
              Pricing
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Base Price</span>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {service.pricing.currency} {service.pricing.basePrice}
                </p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Currency</span>
                <p className="mt-1 text-sm text-gray-900">{service.pricing.currency}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Price Type</span>
                <p className="mt-1 text-sm text-gray-900 capitalize">{service.pricing.priceType}</p>
              </div>
            </div>

            {/* Price Variations */}
            {service.pricing.variations && service.pricing.variations.length > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Price Variations</span>
                <div className="mt-2 space-y-2">
                  {service.pricing.variations.map((variation, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{variation.name}</span>
                        {variation.conditions && (
                          <p className="text-xs text-gray-500">{variation.conditions}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {service.pricing.currency} {variation.price}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Duration Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-gray-500" />
              Duration
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Estimated Duration</span>
                <p className="mt-1 text-sm text-gray-900">{service.duration.estimated} minutes</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">Buffer Time</span>
                <p className="mt-1 text-sm text-gray-900">{service.duration.buffer} minutes</p>
              </div>
            </div>
          </div>

          {/* Requirements */}
          {service.requirements && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-500" />
                Requirements
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-40">Vaccination Required:</span>
                  <span className={`text-sm ${service.requirements.vaccinationRequired ? 'text-green-600' : 'text-gray-500'}`}>
                    {service.requirements.vaccinationRequired ? 'Yes' : 'No'}
                  </span>
                </div>

                {service.requirements.requiredVaccines && service.requirements.requiredVaccines.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Required Vaccines:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {service.requirements.requiredVaccines.map((vaccine, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {vaccine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(service.requirements.ageRestrictions?.minAge || service.requirements.ageRestrictions?.maxAge) && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Age Restrictions:</span>
                    <p className="mt-1 text-sm text-gray-900">
                      {service.requirements.ageRestrictions.minAge && service.requirements.ageRestrictions.maxAge
                        ? `${service.requirements.ageRestrictions.minAge} - ${service.requirements.ageRestrictions.maxAge} months`
                        : service.requirements.ageRestrictions.minAge
                        ? `Minimum ${service.requirements.ageRestrictions.minAge} months`
                        : `Maximum ${service.requirements.ageRestrictions.maxAge} months`
                      }
                    </p>
                  </div>
                )}

                {service.requirements.specialRequirements && service.requirements.specialRequirements.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">Special Requirements:</span>
                    <div className="mt-1 space-y-1">
                      {service.requirements.specialRequirements.map((requirement, index) => (
                        <p key={index} className="text-sm text-gray-900">• {requirement}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Staff Assignment
          {service.staff && service.staff.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2 text-gray-500" />
                Assigned Staff ({service.staff.length})
              </h4>
              
              <div className="space-y-2">
                {service.staff.map((staffAssignment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {staffAssignment.user?.fullName}
                      </span>
                      {staffAssignment.user?.profile?.email && (
                        <p className="text-xs text-gray-500">{staffAssignment.user.profile.email}</p>
                      )}
                    </div>
                    {/* <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      staffAssignment.skillLevel === 'expert' ? 'bg-green-100 text-green-800' :
                      staffAssignment.skillLevel === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {staffAssignment.skillLevel}
                    </span> */}
                  {/* </div>
                ))}
              </div>
            </div>
          )} */} 

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <span className="font-medium">Created:</span>
                <p>{new Date(service.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>
                <p>{new Date(service.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            Edit Service
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetails;