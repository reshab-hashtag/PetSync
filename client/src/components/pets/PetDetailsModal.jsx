// client/src/components/pets/PetDetailsModal.jsx
import React from 'react';
import {
    XMarkIcon,
    HeartIcon,
    UserIcon,
    PhoneIcon,
    MapPinIcon,
    CalendarIcon,
    ScaleIcon,
    PaintBrushIcon,
    IdentificationIcon,
    ShieldCheckIcon,
    ExclamationTriangleIcon,
    ClipboardDocumentListIcon,
    BuildingOfficeIcon,
    EnvelopeIcon
} from '@heroicons/react/24/outline';

const PetDetailsModal = ({ isOpen, onClose, pet }) => {
    if (!isOpen || !pet) return null;

    const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return 'Unknown';
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        const ageInMs = today - birthDate;
        const ageInYears = Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000));
        const ageInMonths = Math.floor((ageInMs % (365.25 * 24 * 60 * 60 * 1000)) / (30.44 * 24 * 60 * 60 * 1000));

        if (ageInYears > 0) {
            return ageInMonths > 0 ? `${ageInYears} years, ${ageInMonths} months` : `${ageInYears} years`;
        } else {
            return ageInMonths > 0 ? `${ageInMonths} months` : 'Less than 1 month';
        }
    };

    const getSpeciesIcon = (species) => {
        switch (species?.toLowerCase()) {
            case 'dog': return '🐕';
            case 'cat': return '🐱';
            case 'bird': return '🐦';
            case 'rabbit': return '🐰';
            default: return '🐾';
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Not specified';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-2xl">
                                {getSpeciesIcon(pet.profile?.species)}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {pet.profile?.name || 'Unknown Pet'}
                            </h2>
                            <p className="text-gray-600">
                                {pet.profile?.breed || 'Unknown Breed'} • {pet.profile?.species || 'Unknown Species'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <HeartIcon className="h-5 w-5 mr-2 text-red-500" />
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <CalendarIcon className="h-4 w-4 text-gray-500 mr-2" />
                                    <span className="text-sm font-medium text-gray-700">Date of Birth</span>
                                </div>
                                <p className="text-gray-900 font-medium">{formatDate(pet.profile?.dateOfBirth)}</p>
                                <p className="text-sm text-gray-500">Age: {calculateAge(pet.profile?.dateOfBirth)}</p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Gender</span>
                                </div>
                                <p className="text-gray-900 font-medium capitalize">
                                    {pet.profile?.gender || 'Not specified'}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <ScaleIcon className="h-4 w-4 text-gray-500 mr-2" />
                                    <span className="text-sm font-medium text-gray-700">Weight</span>
                                </div>
                                <p className="text-gray-900 font-medium">
                                    {pet.profile?.weight ? `${pet.profile.weight} lbs` : 'Not specified'}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <PaintBrushIcon className="h-4 w-4 text-gray-500 mr-2" />
                                    <span className="text-sm font-medium text-gray-700">Color</span>
                                </div>
                                <p className="text-gray-900 font-medium">
                                    {pet.profile?.color || 'Not specified'}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <IdentificationIcon className="h-4 w-4 text-gray-500 mr-2" />
                                    <span className="text-sm font-medium text-gray-700">Microchip ID</span>
                                </div>
                                <p className="text-gray-900 font-medium">
                                    {pet.profile?.microchipId || 'Not registered'}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center mb-2">
                                    <span className="text-sm font-medium text-gray-700">Status</span>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pet.status === 'active'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {pet.status || 'Active'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Owner Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <UserIcon className="h-5 w-5 mr-2 text-blue-500" />
                            Owner Information
                        </h3>
                        <div className="bg-blue-50 rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                                <UserIcon className="h-8 w-8 text-blue-600 mt-1" />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900">
                                        {pet.owner?.profile?.firstName || pet.owner?.firstName} {pet.owner?.profile?.lastName || pet.owner?.lastName}
                                    </h4>
                                    <div className="mt-2 space-y-1">
                                        {(pet.owner?.profile?.email || pet.owner?.email) && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <EnvelopeIcon className="h-4 w-4 mr-2" />
                                                {pet.owner.profile?.email || pet.owner.email}
                                            </div>
                                        )}
                                        {(pet.owner?.profile?.phone || pet.owner?.phone) && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <PhoneIcon className="h-4 w-4 mr-2" />
                                                {pet.owner.profile?.phone || pet.owner.phone}
                                            </div>
                                        )}
                                        {pet.owner?.profile?.address && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <MapPinIcon className="h-4 w-4 mr-2" />
                                                {typeof pet.owner.profile.address === 'string'
                                                    ? pet.owner.profile.address
                                                    : `${pet.owner.profile.address.street || ''} ${pet.owner.profile.address.city || ''} ${pet.owner.profile.address.state || ''} ${pet.owner.profile.address.zipCode || ''}`.trim()
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Business Information */}
                    {/* {pet.business && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BuildingOfficeIcon className="h-5 w-5 mr-2 text-green-500" />
                Registered Business
              </h3>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <BuildingOfficeIcon className="h-8 w-8 text-green-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {pet.business?.profile?.name || pet.business?.name || 'Business Name'}
                    </h4>
                    <div className="mt-2 space-y-1">
                      {pet.business?.profile?.email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <EnvelopeIcon className="h-4 w-4 mr-2" />
                          {pet.business.profile.email}
                        </div>
                      )}
                      {pet.business?.profile?.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <PhoneIcon className="h-4 w-4 mr-2" />
                          {pet.business.profile.phone}
                        </div>
                      )}
                      {pet.business?.profile?.address && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2" />
                          {typeof pet.business.profile.address === 'string' 
                            ? pet.business.profile.address 
                            : `${pet.business.profile.address.street || ''} ${pet.business.profile.address.city || ''} ${pet.business.profile.address.state || ''} ${pet.business.profile.address.zipCode || ''}`.trim()
                          }
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )} */}

                    {/* Medical History */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <ShieldCheckIcon className="h-5 w-5 mr-2 text-purple-500" />
                            Medical History
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-red-50 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                                    <h4 className="font-medium text-gray-900">Allergies</h4>
                                </div>
                                {pet.medicalHistory?.allergies?.length > 0 ? (
                                    <ul className="space-y-1">
                                        {pet.medicalHistory.allergies.map((allergy, index) => (
                                            <li key={index} className="text-sm text-gray-700 bg-white px-2 py-1 rounded">
                                                {allergy}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">No known allergies</p>
                                )}
                            </div>

                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <ClipboardDocumentListIcon className="h-5 w-5 text-blue-500 mr-2" />
                                    <h4 className="font-medium text-gray-900">Medications</h4>
                                </div>
                                {pet.medicalHistory?.medications?.length > 0 ? (
                                    <ul className="space-y-1">
                                        {pet.medicalHistory.medications.map((medication, index) => (
                                            <li key={index} className="text-sm text-gray-700 bg-white px-2 py-1 rounded">
                                                {medication}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">No current medications</p>
                                )}
                            </div>

                            <div className="bg-yellow-50 rounded-lg p-4">
                                <div className="flex items-center mb-3">
                                    <ShieldCheckIcon className="h-5 w-5 text-yellow-500 mr-2" />
                                    <h4 className="font-medium text-gray-900">Conditions</h4>
                                </div>
                                {pet.medicalHistory?.conditions?.length > 0 ? (
                                    <ul className="space-y-1">
                                        {pet.medicalHistory.conditions.map((condition, index) => (
                                            <li key={index} className="text-sm text-gray-700 bg-white px-2 py-1 rounded">
                                                {condition}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-500">No known conditions</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Emergency Contact */}
                    {pet.emergencyContact && (pet.emergencyContact.name || pet.emergencyContact.phone) && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <PhoneIcon className="h-5 w-5 mr-2 text-orange-500" />
                                Emergency Contact
                            </h3>
                            <div className="bg-orange-50 rounded-lg p-4">
                                <div className="flex items-start space-x-4">
                                    <PhoneIcon className="h-8 w-8 text-orange-600 mt-1" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900">
                                            {pet.emergencyContact.name || 'Emergency Contact'}
                                        </h4>
                                        <div className="mt-2 space-y-1">
                                            {pet.emergencyContact.phone && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <PhoneIcon className="h-4 w-4 mr-2" />
                                                    {pet.emergencyContact.phone}
                                                </div>
                                            )}
                                            {pet.emergencyContact.relationship && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <UserIcon className="h-4 w-4 mr-2" />
                                                    {pet.emergencyContact.relationship}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {pet.profile?.notes && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                                <ClipboardDocumentListIcon className="h-5 w-5 mr-2 text-gray-500" />
                                Additional Notes
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 whitespace-pre-wrap">{pet.profile.notes}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PetDetailsModal;