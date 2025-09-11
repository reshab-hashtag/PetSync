import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchBusinesses,
    selectBusinesses,
    selectBusinessLoading,
    selectBusinessError,
} from '../../store/slices/businessSlice';
import BusinessAdminRegistrationForm from './BusinessAdminRegistrationForm';
import {
    BuildingOfficeIcon,
    PlusIcon,
    UserIcon,
    CheckCircleIcon,
    XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const BusinessListWithRegistrationModal = () => {
    const dispatch = useDispatch();
    const businesses = useSelector(selectBusinesses);
    const loading = useSelector(selectBusinessLoading);
    const error = useSelector(selectBusinessError);
    const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);

    // Get user role from auth state
    const { user } = useSelector(state => state.auth);
    const isSuperAdmin = user?.role === 'super_admin';

    // Fetch businesses on component mount
    useEffect(() => {
        dispatch(fetchBusinesses({}));
    }, [dispatch]);

    if (!user) {
        return (
           <LoadingSpinner/>
        );
    }
    // Toggle registration modal
    const toggleRegistrationModal = () => {
        setIsRegistrationModalOpen(!isRegistrationModalOpen);
    };

    // Toggle details modal
    const toggleDetailsModal = (adminData = null) => {
        setSelectedAdmin(adminData);
        setIsDetailsModalOpen(!isDetailsModalOpen);
    };

    // Render business admin card (for super admin view)
    const renderBusinessAdminCard = (adminData) => (
        <li key={adminData._id} className="px-6 py-4">
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    {/* Admin Info */}
                    <div className="flex items-center mb-3">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <h3 className="text-lg font-medium text-gray-900">
                            {adminData.adminInfo.firstName} {adminData.adminInfo.lastName}
                        </h3>
                        {adminData.adminInfo.isActive ? (
                            <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
                        ) : (
                            <XCircleIcon className="h-5 w-5 text-red-500 ml-2" />
                        )}
                    </div>

                    <div className="mb-3">
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Email:</span> {adminData.adminInfo.email}
                        </p>
                        {adminData.adminInfo.phone && (
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Phone:</span> {adminData.adminInfo.phone}
                            </p>
                        )}
                        <p className="text-sm text-gray-600">
                            <span className="font-medium">Joined:</span> {new Date(adminData.adminInfo.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Businesses owned by this admin */}
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                            Businesses Owned ({adminData.totalBusinesses})
                        </h4>
                        {adminData.businesses.length > 0 ? (
                            <div className="space-y-2">
                                {adminData.businesses.map((business) => (
                                    <div key={business._id} className="pl-4 border-l-2 border-indigo-200">
                                        <p className="text-sm font-medium text-gray-800">
                                            {business.profile.name}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic">No businesses registered</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-col space-y-2">
                    <button
                        className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        onClick={() => toggleDetailsModal(adminData)}
                    >
                        View Details
                    </button>
                </div>
            </div>
        </li>
    );

    return (
        <div className="min-h-fit bg-gray-50 py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Business Directory
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Manage and register businesses
                        </p>
                    </div>
                    <button
                        onClick={toggleRegistrationModal}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Register New Business
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <BuildingOfficeIcon className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <LoadingSpinner size="lg" />
                        <span className="ml-3 text-gray-600">Loading businesses...</span>
                    </div>
                ) : (
                    /* Business List */
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        {businesses.length === 0 ? (
                            <div className="text-center py-12">
                                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No businesses found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Get started by registering a new business.
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {isSuperAdmin ? (
                                    // Super admin view: show admins and their businesses
                                    businesses.map((adminData) => renderBusinessAdminCard(adminData))
                                ) : (
                                    // Regular view: show businesses
                                    <>
                                    </>
                                )}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Registration Modal */}
            {isRegistrationModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={toggleRegistrationModal}
                        />
                        {/* Modal Content */}
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
                            <div className="flex justify-end p-2">
                                <button
                                    onClick={toggleRegistrationModal}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <BusinessAdminRegistrationForm />
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {isDetailsModalOpen && selectedAdmin && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                            onClick={() => toggleDetailsModal()}
                        />
                        {/* Modal Content */}
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4">
                            <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Admin Details
                                </h2>
                                <button
                                    onClick={() => toggleDetailsModal()}
                                    className="text-gray-400 hover:text-gray-500"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Admin Information */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Administrator Information
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Full Name</p>
                                            <p className="text-sm text-gray-600">
                                                {selectedAdmin.adminInfo.firstName} {selectedAdmin.adminInfo.lastName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Email</p>
                                            <p className="text-sm text-gray-600">{selectedAdmin.adminInfo.email}</p>
                                        </div>
                                        {selectedAdmin.adminInfo.phone && (
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">Phone</p>
                                                <p className="text-sm text-gray-600">{selectedAdmin.adminInfo.phone}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Status</p>
                                            <p className="text-sm text-gray-600 flex items-center">
                                                {selectedAdmin.adminInfo.isActive ? (
                                                    <>
                                                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                                                        Inactive
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Joined</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(selectedAdmin.adminInfo.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Businesses Owned */}
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                                        Businesses Owned ({selectedAdmin.totalBusinesses})
                                    </h3>
                                    {selectedAdmin.businesses.length > 0 ? (
                                        <div className="space-y-4">
                                            {selectedAdmin.businesses.map((business) => (
                                                <div
                                                    key={business._id}
                                                    className="p-4 bg-gray-50 rounded-md border border-gray-200"
                                                >
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                        {business.profile.name}
                                                    </h4>
                                                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Company Name</p>
                                                            <p className="text-sm text-gray-600">{business.profile.companyName}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Email</p>
                                                            <p className="text-sm text-gray-600">{business.profile.email}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-700">Phone</p>
                                                            <p className="text-sm text-gray-600">{business.profile.phone}</p>
                                                        </div>
                                                        {business.profile.category && (
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-700">Category</p>
                                                                <p className="text-sm text-gray-600">{business.profile.category.name}</p>
                                                            </div>
                                                        )}
                                                        {business.profile.website && (
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-700">Website</p>
                                                                <p className="text-sm text-gray-600">
                                                                    <a
                                                                        href={business.profile.website}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-indigo-600 hover:text-indigo-800"
                                                                    >
                                                                        {business.profile.website}
                                                                    </a>
                                                                </p>
                                                            </div>
                                                        )}
                                                        {business.profile.description && (
                                                            <div className="sm:col-span-2">
                                                                <p className="text-sm font-medium text-gray-700">Description</p>
                                                                <p className="text-sm text-gray-600">{business.profile.description}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 italic">No businesses registered</p>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200">
                                <button
                                    onClick={() => toggleDetailsModal()}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusinessListWithRegistrationModal;