import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserProfile } from '../../store/slices/authSlice';
import {
    CameraIcon,
    PencilIcon,
    CalendarIcon,
    MapPinIcon,
    PhoneIcon,
    EnvelopeIcon,
    BuildingOfficeIcon,
    HeartIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Profile = () => {
    console.log('Profile component rendered');
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
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
            // Show success message
        } catch (error) {
            // Show error message
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
                            <div className="relative inline-block">
                                <div className="h-32 w-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
                                    <span className="text-4xl font-bold text-white">
                                        {user?.profile?.firstName?.[0]}{user?.profile?.lastName?.[0]}
                                    </span>
                                </div>
                                {isEditing && (
                                    <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50">
                                        <CameraIcon className="h-5 w-5 text-gray-600" />
                                    </button>
                                )}
                            </div>

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
                                    <div className="mt-1 flex items-center w-fit mx-auto">
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
                                    <div className="mt-1 flex items-center w-fit mx-auto">
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
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;