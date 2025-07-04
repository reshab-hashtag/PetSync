import React from 'react';

const Step3 = ({ formData, handleChange }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lg:col-span-2 space-y-2">
                    <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                        Street Address
                    </label>
                    <input
                        type="text"
                        id="address.street"
                        name="address.street"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        value={formData.address.street}
                        onChange={handleChange}
                        placeholder="Enter street address"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                        City
                    </label>
                    <input
                        type="text"
                        id="address.city"
                        name="address.city"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        value={formData.address.city}
                        onChange={handleChange}
                        placeholder="Enter city"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                        State
                    </label>
                    <input
                        type="text"
                        id="address.state"
                        name="address.state"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        value={formData.address.state}
                        onChange={handleChange}
                        placeholder="Enter state"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700">
                        ZIP Code
                    </label>
                    <input
                        type="text"
                        id="address.zipCode"
                        name="address.zipCode"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        placeholder="Enter ZIP code"
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
                        Country
                    </label>
                    <select
                        id="address.country"
                        name="address.country"
                        className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
                        value={formData.address.country}
                        onChange={handleChange}
                    >
                        <option value="India">India</option>
                        <option value="USA">USA</option>
                        <option value="UK">UK</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default Step3;
