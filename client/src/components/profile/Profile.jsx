import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../../store/slices/authSlice';
import {
    PencilIcon,
    CalendarIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    BuildingOfficeIcon,
    HeartIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AvatarUpload from '../../components/common/AvatarUpload';

const Profile = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState(null);
    
    const [formData, setFormData] = useState({
        firstName: user?.profile?.firstName || '',
        lastName: user?.profile?.lastName || '',
        email: user?.profile?.email || '',
        phone: user?.profile?.phone || '',
        dateOfBirth: user?.profile?.dateOfBirth || '',
        bio: user?.profile?.bio || '',
        address: {
            street: user?.profile?.address?.street || '',
            city: user?.profile?.address?.city || '',
            state: user?.profile?.address?.state || '',
            zipCode: user?.profile?.address?.zipCode || '',
        },
        emergencyContact: {
            name: user?.profile?.emergencyContact?.name || '',
            phone: user?.profile?.emergencyContact?.phone || '',
            relationship: user?.profile?.emergencyContact?.relationship || '',
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
            dateOfBirth: user?.profile?.dateOfBirth || '',
            bio: user?.profile?.bio || '',
            address: {
                street: user?.profile?.address?.street || '',
                city: user?.profile?.address?.city || '',
                state: user?.profile?.address?.state || '',
                zipCode: user?.profile?.address?.zipCode || '',
            },
            emergencyContact: {
                name: user?.profile?.emergencyContact?.name || '',
                phone: user?.profile?.emergencyContact?.phone || '',
                relationship: user?.profile?.emergencyContact?.relationship || '',
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

    const getRoleDisplayName = (role) => {
        switch (role) {
            case 'super_admin':
                return 'Super Administrator';
            case 'business_admin':
                return 'Business Administrator';
            case 'staff':
                return 'Staff Member';
            case 'client':
                return 'Pet Owner';
            default:
                return role;
        }
    };

    const getRoleColor = (role) => {
        switch (role) {
            case 'super_admin':
                return 'bg-purple-100 text-purple-800';
            case 'business_admin':
                return 'bg-blue-100 text-blue-800';
            case 'staff':
                return 'bg-green-100 text-green-800';
            case 'client':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-md ${
                    notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                }`}>
                    {notification.message}
                </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
                    <p className="text-gray-600">Manage your personal information and preferences</p>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="btn-primary flex items-center"
                    >
                        <PencilIcon className="h-5 w-5 mr-2" />
                        Edit Profile
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <div className="card">
                        {/* Profile Picture */}
                        <div className="text-center">
                            <AvatarUpload
                                size="large"
                                showControls={true}
                                className="mx-auto"
                                onUploadStart={handleAvatarUploadStart}
                                onUploadComplete={handleAvatarUploadComplete}
                                onUploadError={handleAvatarUploadError}
                            />

                            <div className="mt-4">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {user?.profile?.firstName} {user?.profile?.lastName}
                                </h3>
                                <p className="text-gray-500">{user?.profile?.email}</p>
                                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-2 ${getRoleColor(user?.role)}`}>
                                    {getRoleDisplayName(user?.role)}
                                </span>
                            </div>
                        </div>

                        {/* Quick Stats for Pet Owners */}
                        {user?.role === 'client' && (
                            <div className="mt-6 pt-6 border-t">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">3</div>
                                        <div className="text-sm text-gray-500">Pets</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-gray-900">12</div>
                                        <div className="text-sm text-gray-500">Appointments</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Business Info for Staff */}
                        {(user?.role === 'business_admin' || user?.role === 'staff') && (
                            <div className="mt-6 pt-6 border-t">
                                <div className="flex items-center text-sm text-gray-600">
                                    <BuildingOfficeIcon className="h-4 w-4 mr-2" />
                                    <span>Happy Paws Veterinary Clinic</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Profile Information */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                                {isEditing && (
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="btn-secondary"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="btn-primary flex items-center"
                                        >
                                            {loading && <LoadingSpinner size="sm" />}
                                            <span className={loading ? 'ml-2' : ''}>Save Changes</span>
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className="input-field mt-1"
                                            required
                                        />
                                    ) : (
                                        <div className="mt-1 text-sm text-gray-900">{user?.profile?.firstName || 'Not provided'}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className="input-field mt-1"
                                            required
                                        />
                                    ) : (
                                        <div className="mt-1 text-sm text-gray-900">{user?.profile?.lastName || 'Not provided'}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <div className="mt-1 flex items-center">
                                        <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                                        {isEditing ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                className="input-field flex-1"
                                                required
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-900">{user?.profile?.email || 'Not provided'}</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                                    <div className="mt-1 flex items-center">
                                        <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                                        {isEditing ? (
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className="input-field flex-1"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-900">{user?.profile?.phone || 'Not provided'}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                                    <div className="mt-1 flex items-center">
                                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-2" />
                                        {isEditing ? (
                                            <input
                                                type="date"
                                                name="dateOfBirth"
                                                value={formData.dateOfBirth}
                                                onChange={handleInputChange}
                                                className="input-field flex-1"
                                            />
                                        ) : (
                                            <span className="text-sm text-gray-900">
                                                {user?.profile?.dateOfBirth 
                                                    ? new Date(user.profile.dateOfBirth).toLocaleDateString()
                                                    : 'Not provided'
                                                }
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Bio</label>
                                    {isEditing ? (
                                        <textarea
                                            name="bio"
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="input-field mt-1"
                                            placeholder="Tell us a little about yourself..."
                                        />
                                    ) : (
                                        <div className="mt-1 text-sm text-gray-900">
                                            {user?.profile?.bio || 'No bio provided'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Address Information */}
                        <div className="card">
                            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                                <MapPinIcon className="h-5 w-5 mr-2" />
                                Address
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Street Address</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="address.street"
                                            value={formData.address.street}
                                            onChange={handleInputChange}
                                            className="input-field mt-1"
                                        />
                                    ) : (
                                        <div className="mt-1 text-sm text-gray-900">{user?.profile?.address?.street || 'Not provided'}</div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">City</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="address.city"
                                                value={formData.address.city}
                                                onChange={handleInputChange}
                                                className="input-field mt-1"
                                            />
                                        ) : (
                                            <div className="mt-1 text-sm text-gray-900">{user?.profile?.address?.city || 'Not provided'}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">State</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="address.state"
                                                value={formData.address.state}
                                                onChange={handleInputChange}
                                                className="input-field mt-1"
                                            />
                                        ) : (
                                            <div className="mt-1 text-sm text-gray-900">{user?.profile?.address?.state || 'Not provided'}</div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                name="address.zipCode"
                                                value={formData.address.zipCode}
                                                onChange={handleInputChange}
                                                className="input-field mt-1"
                                            />
                                        ) : (
                                            <div className="mt-1 text-sm text-gray-900">{user?.profile?.address?.zipCode || 'Not provided'}</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Emergency Contact Information */}
                        <div className="card">
                            <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                                <HeartIcon className="h-5 w-5 mr-2" />
                                Emergency Contact
                            </h3>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="emergencyContact.name"
                                            value={formData.emergencyContact.name}
                                            onChange={handleInputChange}
                                            className="input-field mt-1"
                                        />
                                    ) : (
                                        <div className="mt-1 text-sm text-gray-900">{user?.profile?.emergencyContact?.name || 'Not provided'}</div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            name="emergencyContact.phone"
                                            value={formData.emergencyContact.phone}
                                            onChange={handleInputChange}
                                            className="input-field mt-1"
                                        />
                                    ) : (
                                        <div className="mt-1 text-sm text-gray-900">{user?.profile?.emergencyContact?.phone || 'Not provided'}</div>
                                    )}
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Relationship</label>
                                    {isEditing ? (
                                        <select
                                            name="emergencyContact.relationship"
                                            value={formData.emergencyContact.relationship}
                                            onChange={handleInputChange}
                                            className="input-field mt-1"
                                        >
                                            <option value="">Select relationship</option>
                                            <option value="spouse">Spouse</option>
                                            <option value="parent">Parent</option>
                                            <option value="child">Child</option>
                                            <option value="sibling">Sibling</option>
                                            <option value="friend">Friend</option>
                                            <option value="other">Other</option>
                                        </select>
                                    ) : (
                                        <div className="mt-1 text-sm text-gray-900">
                                            {user?.profile?.emergencyContact?.relationship || 'Not provided'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;