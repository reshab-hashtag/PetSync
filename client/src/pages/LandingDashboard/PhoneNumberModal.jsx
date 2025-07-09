import { PhoneIcon, XMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

const PhoneNumberModal = ({
    showPhoneModal,
    setShowPhoneModal,
    pendingContactBusiness,
    handlePhoneSubmit,
    phoneNumber,
    setPhoneNumber,
    setPendingContactBusiness
}) => {
    return (
        <div>
            {showPhoneModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Enter Your Phone Number</h3>
                            <button
                                onClick={() => setShowPhoneModal(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        <p className="text-gray-600 mb-6">
                            {pendingContactBusiness
                                ? 'Please provide your phone number to contact this business.'
                                : 'We need your phone number to show you personalized results and help businesses contact you.'
                            }
                        </p>

                        <form onSubmit={handlePhoneSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="+91 12345 67890"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPhoneModal(false);
                                            setPendingContactBusiness(null);
                                        }}
                                        className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Continue
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhoneNumberModal;
