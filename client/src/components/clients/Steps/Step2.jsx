// client/src/components/clients/Steps/Step2.jsx (Updated to handle edit mode)
import React from 'react';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Step2 = ({ 
    formData, 
    handleChange, 
    showPassword, 
    setShowPassword, 
    showConfirmPassword, 
    setShowConfirmPassword,
    isEdit = false
}) => {
    return (
        <div className="space-y-6">
            {isEdit && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Leave password fields empty to keep the current password unchanged.
                    </p>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        {isEdit ? 'New Password' : 'Password'} {!isEdit && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            placeholder={isEdit ? 'Enter new password (optional)' : 'Enter your password'}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                                <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                    </div>
                    {!isEdit && (
                        <p className="mt-1 text-sm text-gray-500">
                            Password must be at least 6 characters long
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        {isEdit ? 'Confirm New Password' : 'Confirm Password'} {!isEdit && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            placeholder={isEdit ? 'Confirm new password' : 'Confirm your password'}
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? (
                                <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                                <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {isEdit && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Must be at least 6 characters long</li>
                        <li>• Both password fields must match</li>
                        <li>• Leave empty to keep current password</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Step2;