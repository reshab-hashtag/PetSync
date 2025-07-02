// client/src/components/staff/BusinessAssignmentModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    BuildingOfficeIcon,
    CheckIcon,
    XMarkIcon,
    UsersIcon,
    PlusIcon,
    MinusIcon
} from '@heroicons/react/24/outline';
import { addStaffToBusiness, fetchBusinesses } from '../../store/slices/businessSlice';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';

const BusinessAssignmentModal = ({
    isOpen,
    onClose,
    staff,
    onSuccess
}) => {
    const dispatch = useDispatch();
    const { businesses, loading: loadingBusinesses } = useSelector(state => state.business);

    const [originalBusinessIds, setOriginalBusinessIds] = useState([]);
    const [selectedNewBusinessId, setSelectedNewBusinessId] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Fetch businesses using Redux action (same as BusinessList)
            dispatch(fetchBusinesses({ page: 1, limit: 100 })); // Fetch all businesses for selection

            if (staff) {
                const currentBusinessIds = staff.business?.map(b =>
                    typeof b === 'object' ? b._id : b
                ) || [];
                setOriginalBusinessIds(currentBusinessIds);
                setSelectedNewBusinessId(null); // Reset new selection
            }
        }
    }, [isOpen, staff, dispatch]);

    const handleBusinessSelection = (businessId, checked) => {
        // If unchecking, clear the selection
        if (!checked) {
            setSelectedNewBusinessId(null);
            return;
        }

        // If checking, set this as the new selected business
        setSelectedNewBusinessId(businessId);
    };

    const handleSave = async () => {
        if (!selectedNewBusinessId) {
            toast.error('Please select a business to assign');
            return;
        }

        console.log('Saving new business assignment:', selectedNewBusinessId);

        // Send the business ID and staff details to the API
        const result = await dispatch(addStaffToBusiness({
            businessId: selectedNewBusinessId,
            email: staff?.profile?.email,
            role: staff?.role || 'staff'
        }));

        if (addStaffToBusiness.fulfilled.match(result)) {
            toast.success('Staff assigned to business successfully!');
            onSuccess();
            onClose();
        }
        // errors handled in the effect above
    };

    const getAssignmentStatus = (businessId) => {
        const isOriginallyAssigned = originalBusinessIds.includes(businessId);
        const isNewlySelected = selectedNewBusinessId === businessId;

        if (isOriginallyAssigned) {
            return 'existing';
        } else if (isNewlySelected) {
            return 'new_selection';
        } else {
            return 'available';
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'existing':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        <CheckIcon className="w-3 h-3 mr-1" />
                        Assigned
                    </span>
                );
            case 'new_selection':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <PlusIcon className="w-3 h-3 mr-1" />
                        New Selection
                    </span>
                );
            default:
                return null;
        }
    };

    const getSubscriptionBadge = (subscription) => {
        const styles = {
            free: 'bg-gray-100 text-gray-800',
            basic: 'bg-blue-100 text-blue-800',
            premium: 'bg-purple-100 text-purple-800'
        };

        return (
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${styles[subscription?.plan] || styles.free}`}>
                {subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1) || 'Free'}
            </span>
        );
    };

    // Filter businesses into existing and available
    const existingBusinesses = businesses.filter(business => 
        originalBusinessIds.includes(business._id)
    );
    const availableBusinesses = businesses.filter(business => 
        !originalBusinessIds.includes(business._id)
    );

    if (!isOpen) return null;

    return (
        <div className="space-y-6">
            {/* Staff Info */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                        <UsersIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-gray-900">
                            {staff?.profile?.firstName} {staff?.profile?.lastName}
                        </h3>
                        <p className="text-sm text-gray-500">{staff?.profile?.email}</p>
                        <p className="text-sm text-gray-500">
                            Role: <span className="font-medium capitalize">{staff?.role || 'staff'}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-blue-900">Assignment Summary</p>
                        <p className="text-sm text-blue-700">
                            Currently assigned to {originalBusinessIds.length} business(es)
                            {selectedNewBusinessId && (
                                <span className="ml-2 font-medium text-green-700">
                                    (+1 new selection)
                                </span>
                            )}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-blue-700">
                            Available: {availableBusinesses.length} businesses
                        </p>
                    </div>
                </div>
            </div>

            {/* Existing Assignments */}
            {existingBusinesses.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">Current Assignments</h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                        {existingBusinesses.map((business) => (
                            <div
                                key={business._id}
                                className="flex items-center p-3 rounded-lg border border-blue-200 bg-blue-50"
                            >
                                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                    <BuildingOfficeIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {business.profile?.name}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {business.profile?.email}
                                    </p>
                                </div>

                                <div className="ml-4">
                                    {getStatusBadge('existing')}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Businesses for New Assignment */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">
                        Select New Business Assignment
                    </h4>
                    <p className="text-sm text-gray-500">
                        Choose one additional business
                    </p>
                </div>

                {loadingBusinesses ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                        {availableBusinesses.length === 0 ? (
                            <div className="text-center py-8">
                                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No available businesses</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    All businesses are already assigned to this staff member.
                                </p>
                            </div>
                        ) : (
                            availableBusinesses.map((business) => {
                                const isSelected = selectedNewBusinessId === business._id;
                                const status = getAssignmentStatus(business._id);

                                return (
                                    <label
                                        key={business._id}
                                        className={`flex items-center p-4 rounded-lg border transition-colors cursor-pointer ${isSelected
                                                ? 'border-indigo-300 bg-indigo-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="newBusinessAssignment"
                                            className="text-indigo-600 focus:ring-indigo-500 mr-4"
                                            checked={isSelected}
                                            onChange={(e) => handleBusinessSelection(business._id, e.target.checked)}
                                            disabled={loading}
                                        />

                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                                                    <BuildingOfficeIcon className={`h-6 w-6 ${isSelected ? 'text-indigo-600' : 'text-gray-400'
                                                        }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {business.profile?.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {business.profile?.email}
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className="text-xs text-gray-500">
                                                            {business.staff?.length || 0} staff
                                                        </span>
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${business.isActive
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {business.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                        {business.subscription && getSubscriptionBadge(business.subscription)}
                                                    </div>
                                                    {business.profile?.description && (
                                                        <p className="text-xs text-gray-400 truncate mt-1">
                                                            {business.profile.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="ml-4 flex flex-col items-end space-y-1">
                                            {getStatusBadge(status)}
                                            {isSelected && (
                                                <CheckIcon className="h-5 w-5 text-indigo-600" />
                                            )}
                                        </div>
                                    </label>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Selection Summary */}
                {selectedNewBusinessId && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm text-green-800">
                            <span className="font-medium">New Assignment:</span>
                            <div className="mt-1">
                                {availableBusinesses.find(b => b._id === selectedNewBusinessId)?.profile?.name} will be assigned to this staff member.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onClose}
                    className="btn-secondary"
                    disabled={loading}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="btn-primary inline-flex items-center"
                    disabled={loading || !selectedNewBusinessId}
                >
                    {loading && <LoadingSpinner size="sm" className="mr-2" />}
                    Assign Business
                </button>
            </div>
        </div>
    );
};

export default BusinessAssignmentModal;