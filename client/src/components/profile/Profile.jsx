import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../../store/slices/authSlice';
import {
    PencilIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    CheckCircleIcon,
    ShieldCheckIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AvatarUpload from '../../components/common/AvatarUpload';
import ChangePasswordModal from './ChangePasswordModal';

const Profile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

    const [formData, setFormData] = useState({
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        email: user?.profile?.email || '',
        phone: user?.profile?.phone || '',
        address: {
            street: user?.profile?.address?.street || '',
            city: user?.profile?.address?.city || '',
            state: user?.profile?.address?.state || '',
            zipCode: user?.profile?.address?.zipCode || '',
        }
    });

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...prev[parent],
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await dispatch(updateUserProfile(formData));
            setIsEditing(false);
            showNotification('Profile updated successfully!');
        } catch (error) {
            showNotification('Failed to update profile. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            firstName: user?.profile?.firstName || '',
            lastName: user?.profile?.lastName || '',
            email: user?.profile?.email || '',
            phone: user?.profile?.phone || '',
            address: {
                street: user?.profile?.address?.street || '',
                city: user?.profile?.address?.city || '',
                state: user?.profile?.address?.state || '',
                zipCode: user?.profile?.address?.zipCode || '',
            }
        });
        setIsEditing(false);
    };

    // Avatar upload callbacks
    const handleAvatarUploadStart = () => {
        showNotification('Uploading avatar...', 'info');
    };

    const handleAvatarUploadComplete = () => {
        showNotification('Avatar updated successfully!');
    };

    const handleAvatarUploadError = (error) => {
        showNotification(error, 'error');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                            <p className="mt-2 text-gray-600">
                                Manage your personal information and account preferences
                            </p>
                        </div>
                        {!isEditing && (
                            <div className="mt-4 sm:mt-0">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
                                >
                                    <PencilIcon className="w-4 h-4 mr-2" />
                                    Edit Profile
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Profile Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Profile Header */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 px-6 py-8">
                                <div className="text-center">
                                    <div className="relative inline-block">
                                        <AvatarUpload
                                            size="large"
                                            showControls={true}
                                            className="mx-auto"
                                            onUploadStart={handleAvatarUploadStart}
                                            onUploadComplete={handleAvatarUploadComplete}
                                            onUploadError={handleAvatarUploadError}
                                        />
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {user?.profile?.firstName} {user?.profile?.lastName}
                                        </h2>
                                        <p className="text-gray-600 text-sm">{user?.profile?.email}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Section */}
                            <div className="p-6">
                                {/* Account Status */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex items-center space-x-2 text-sm">
                                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                                        <span className="text-gray-600">Account Verified</span>
                                    </div>
                                    <div className="flex items-center space-x-2 text-sm mt-2">

                                        {user.isActive ? <div className="w-4 h-4 bg-green-500 rounded-full"></div> : <div className="w-4 h-4 bg-green-500 rounded-full"></div>}
                                        <span className="text-gray-600">Active Status</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Information Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Personal Information
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-600">
                                                Update your personal details and contact information
                                            </p>
                                        </div>
                                        {isEditing && (
                                            <div className="flex space-x-3">
                                                <button
                                                    type="button"
                                                    onClick={handleCancel}
                                                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium rounded-lg transition-colors duration-200"
                                                >
                                                    <XMarkIcon className="w-4 h-4 mr-2" />
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow-sm transition-colors duration-200"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <LoadingSpinner size="sm" />
                                                            <span className="ml-2">Saving...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                            Save Changes
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="px-6 py-6">
                                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                        {/* First Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                First Name
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="firstName"
                                                    value={formData.firstName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                    placeholder="Enter your first name"
                                                    required
                                                />
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                                    {user?.profile?.firstName || 'Not provided'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Last Name */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Last Name
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="lastName"
                                                    value={formData.lastName}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                    placeholder="Enter your last name"
                                                    required
                                                />
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                                    {user?.profile?.lastName || 'Not provided'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                        placeholder="Enter your email address"
                                                        required
                                                    />
                                                ) : (
                                                    <div className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                                        {user?.profile?.email || 'Not provided'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Phone Number
                                            </label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <PhoneIcon className="h-4 w-4 text-gray-400" />
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="tel"
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                        placeholder="Enter your phone number"
                                                    />
                                                ) : (
                                                    <div className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                                        {user?.profile?.phone || 'Not provided'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address Information Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                                <div className="px-6 py-5 border-b border-gray-200">
                                    <div className="flex items-center space-x-3">
                                        <MapPinIcon className="w-5 h-5 text-gray-600" />
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Address Information
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-600">
                                                Your current address details
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-6 py-6">
                                    <div className="space-y-6">
                                        {/* Street Address */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Street Address
                                            </label>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    name="address.street"
                                                    value={formData.address.street}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                    placeholder="Enter your street address"
                                                />
                                            ) : (
                                                <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                                    {user?.profile?.address?.street || 'Not provided'}
                                                </div>
                                            )}
                                        </div>

                                        {/* City, State, ZIP */}
                                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    City
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="address.city"
                                                        value={formData.address.city}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                        placeholder="City"
                                                    />
                                                ) : (
                                                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                                        {user?.profile?.address?.city || 'Not provided'}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    State/Province
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="address.state"
                                                        value={formData.address.state}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                        placeholder="State"
                                                    />
                                                ) : (
                                                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                                        {user?.profile?.address?.state || 'Not provided'}
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    ZIP/Postal Code
                                                </label>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        name="address.zipCode"
                                                        value={formData.address.zipCode}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                        placeholder="ZIP Code"
                                                    />
                                                ) : (
                                                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                                                        {user?.profile?.address?.zipCode || 'Not provided'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Account Security Card */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                            <div className="px-6 py-5 border-b border-gray-200">
                                <div className="flex items-center space-x-3">
                                    <ShieldCheckIcon className="w-5 h-5 text-gray-600" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Account Security
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-600">
                                            Manage your account security settings
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                            <div>
                                                <div className="text-sm font-medium text-green-900">
                                                    Email Verified
                                                </div>
                                                <div className="text-xs text-green-700">
                                                    Your email address has been verified
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                Password
                                            </div>
                                            {/* <div className="text-xs text-gray-600">
                                                Last updated {user.auth?.lastPasswordChange ?
                                                    new Date(user.auth.lastPasswordChange).toLocaleDateString() :
                                                    '30 days ago'
                                                }
                                            </div> */}
                                        </div>
                                        <button
                                            onClick={() => setShowChangePasswordModal(true)}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                        >
                                            Change Password
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900">
                                                Two-Factor Authentication
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                Add an extra layer of security
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Enable 2FA
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>




            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={showChangePasswordModal}
                onClose={() => setShowChangePasswordModal(false)}
            />
        </div>
    );
};

export default Profile;