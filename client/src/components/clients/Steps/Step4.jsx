import React from 'react';

const Step4 = ({ formData, handleChange }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700">
                        Contact Name
                    </label>
                    <input
                        type="text"
                        id="emergencyContact.name"
                        name="emergencyContact.name"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        value={formData.emergencyContact.name}
                        onChange={handleChange}
                        placeholder="Enter contact name"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-gray-700">
                        Contact Phone
                    </label>
                    <input
                        type="tel"
                        id="emergencyContact.phone"
                        name="emergencyContact.phone"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        value={formData.emergencyContact.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-gray-700">
                        Relationship
                    </label>
                    <select
                        id="emergencyContact.relationship"
                        name="emergencyContact.relationship"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        value={formData.emergencyContact.relationship}
                        onChange={handleChange}
                    >
                        <option value="">Select relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="child">Child</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default Step4;
