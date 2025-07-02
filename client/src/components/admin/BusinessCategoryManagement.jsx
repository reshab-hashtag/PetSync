// client/src/components/admin/BusinessCategoryManagement.jsx (Fixed)
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategoryStats,
    clearErrors,
    selectAllCategories,
    selectAllCategoriesLoading,
    selectAllCategoriesError,
    selectCategoryOperationLoading,
    selectCategoryStats,
    selectCategoryStatsLoading,
    selectCategoryStatsError,
    selectCategoriesPagination
} from '../../store/slices/businessCategorySlice';
import {
    PlusIcon,
    PencilIcon,
    TrashIcon,
    EyeIcon,
    ChartBarIcon,
    Squares2X2Icon,
    XMarkIcon,
    CheckIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';

const BusinessCategoryManagement = () => {
    const dispatch = useDispatch();
    
    // Redux state
    const categories = useSelector(selectAllCategories);
    const loading = useSelector(selectAllCategoriesLoading);
    const error = useSelector(selectAllCategoriesError);
    const pagination = useSelector(selectCategoriesPagination);
    const operationLoading = useSelector(selectCategoryOperationLoading);
    const categoryStats = useSelector(selectCategoryStats);
    const statsLoading = useSelector(selectCategoryStatsLoading);
    const statsError = useSelector(selectCategoryStatsError);

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatsModal, setShowStatsModal] = useState(false);

    // Form states
    const [editingCategory, setEditingCategory] = useState(null);
    const [deletingCategory, setDeletingCategory] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: 'BuildingOfficeIcon',
        color: '#3B82F6',
        displayOrder: 0,
        metadata: {
            allowCustomServices: true,
            requiresSpecialLicense: false,
            tags: []
        }
    });

    // Search and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActive, setFilterActive] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Available icons for categories
    const availableIcons = [
        'BuildingOfficeIcon',
        'HeartIcon',
        'UserGroupIcon',
        'HomeIcon',
        'AcademicCapIcon',
        'BeakerIcon',
        'CameraIcon',
        'GiftIcon',
        'MusicalNoteIcon',
        'PaintBrushIcon',
        'SparklesIcon',
        'StarIcon'
    ];

    // Available colors
    const availableColors = [
        '#3B82F6', // Blue
        '#10B981', // Green
        '#F59E0B', // Yellow
        '#EF4444', // Red
        '#8B5CF6', // Purple
        '#F97316', // Orange
        '#06B6D4', // Cyan
        '#84CC16', // Lime
        '#EC4899', // Pink
        '#6B7280'  // Gray
    ];

    // Load categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    // Refetch when search, filter, or page changes
    useEffect(() => {
        fetchCategories();
    }, [searchTerm, filterActive, currentPage]);

    const fetchCategories = () => {
        const params = {
            page: currentPage,
            limit: 12
        };

        if (searchTerm) {
            params.search = searchTerm;
        }

        if (filterActive !== 'all') {
            params.active = filterActive === 'active';
        }

        dispatch(fetchAllCategories(params));
    };

    const handleFetchStats = () => {
        dispatch(fetchCategoryStats());
        setShowStatsModal(true);
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();

        try {
            await dispatch(createCategory(formData)).unwrap();
            setShowCreateModal(false);
            resetForm();
            // Show success toast (you can add toast notification here)
        } catch (error) {
            console.error('Error creating category:', error);
            // Show error toast
        }
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();

        try {
            await dispatch(updateCategory({
                id: editingCategory._id,
                categoryData: formData
            })).unwrap();
            setShowEditModal(false);
            setEditingCategory(null);
            resetForm();
            // Show success toast
        } catch (error) {
            console.error('Error updating category:', error);
            // Show error toast
        }
    };

    const handleDeleteCategory = async () => {
        try {
            await dispatch(deleteCategory(deletingCategory._id)).unwrap();
            setShowDeleteModal(false);
            setDeletingCategory(null);
            // Show success toast
        } catch (error) {
            console.error('Error deleting category:', error);
            // Show error toast
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            icon: 'BuildingOfficeIcon',
            color: '#3B82F6',
            displayOrder: 0,
            metadata: {
                allowCustomServices: true,
                requiresSpecialLicense: false,
                tags: []
            }
        });
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
            icon: category.icon,
            color: category.color,
            displayOrder: category.displayOrder,
            metadata: {
                allowCustomServices: category.metadata?.allowCustomServices ?? true,
                requiresSpecialLicense: category.metadata?.requiresSpecialLicense ?? false,
                tags: category.metadata?.tags || []
            }
        });
        setShowEditModal(true);
    };

    const openDeleteModal = (category) => {
        setDeletingCategory(category);
        setShowDeleteModal(true);
    };

    // Clear errors when closing modals
    useEffect(() => {
        if (!showCreateModal && !showEditModal && !showDeleteModal) {
            dispatch(clearErrors());
        }
    }, [showCreateModal, showEditModal, showDeleteModal, dispatch]);

    if (loading && !categories.length) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Business Categories</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage business categories that business admins can choose from
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleFetchStats}
                        disabled={statsLoading}
                        className="btn-secondary flex items-center"
                    >
                        <ChartBarIcon className="h-4 w-4 mr-2" />
                        {statsLoading ? 'Loading...' : 'View Stats'}
                    </button>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary flex items-center"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                        <XMarkIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input-field"
                    />
                </div>
                <div className="sm:w-48">
                    <select
                        value={filterActive}
                        onChange={(e) => setFilterActive(e.target.value)}
                        className="input-field"
                    >
                        <option value="all">All Categories</option>
                        <option value="active">Active Only</option>
                        <option value="inactive">Inactive Only</option>
                    </select>
                </div>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                    <div key={category._id} className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                        style={{ backgroundColor: category.color }}
                                    >
                                        <Squares2X2Icon className="h-5 w-5" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-lg font-medium text-gray-900">{category.name}</h3>

                                    </div>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    category.isActive
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {category.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {category.description && (
                                <p className="mt-3 text-sm text-gray-600">{category.description}</p>
                            )}

                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-gray-500">
                                    Order: {category.displayOrder}
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => openEditModal(category)}
                                        disabled={operationLoading.updating}
                                        className="p-1 text-gray-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                                        title="Edit"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(category)}
                                        disabled={operationLoading.deleting}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                        title="Delete"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {categories.length === 0 && !loading && (
                <div className="text-center py-12">
                    <Squares2X2Icon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No categories found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new category.'}
                    </p>
                </div>
            )}

            {/* Pagination */}
            {pagination.total > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                        Showing {categories.length} of {pagination.totalRecords} results
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="btn-secondary disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 text-sm">
                            Page {currentPage} of {pagination.total}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total))}
                            disabled={currentPage === pagination.total}
                            className="btn-secondary disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create Business Category"
            >
                <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="input-field"
                            placeholder="e.g., Pet Grooming"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="input-field"
                            rows={3}
                            placeholder="Brief description of this category"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Icon
                            </label>
                            <select
                                value={formData.icon}
                                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                                className="input-field"
                            >
                                {availableIcons.map(icon => (
                                    <option key={icon} value={icon}>{icon}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableColors.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                                        className={`w-8 h-8 rounded-full border-2 ${
                                            formData.color === color ? 'border-gray-900' : 'border-gray-300'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Display Order
                        </label>
                        <input
                            type="number"
                            value={formData.displayOrder}
                            onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                            className="input-field"
                            min="0"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Settings
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.metadata.allowCustomServices}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        metadata: { ...prev.metadata, allowCustomServices: e.target.checked }
                                    }))}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Allow custom services</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.metadata.requiresSpecialLicense}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        metadata: { ...prev.metadata, requiresSpecialLicense: e.target.checked }
                                    }))}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Requires special license</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowCreateModal(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={operationLoading.creating}
                            className="btn-primary"
                        >
                            {operationLoading.creating ? (
                                <div className="flex items-center">
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Creating...
                                </div>
                            ) : (
                                'Create Category'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title="Edit Business Category"
            >
                <form onSubmit={handleUpdateCategory} className="space-y-4">
                    {/* Same form fields as create modal */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="input-field"
                            placeholder="e.g., Pet Grooming"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="input-field"
                            rows={3}
                            placeholder="Brief description of this category"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Icon
                            </label>
                            <select
                                value={formData.icon}
                                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                                className="input-field"
                            >
                                {availableIcons.map(icon => (
                                    <option key={icon} value={icon}>{icon}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableColors.map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                                        className={`w-8 h-8 rounded-full border-2 ${
                                            formData.color === color ? 'border-gray-900' : 'border-gray-300'
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Display Order
                        </label>
                        <input
                            type="number"
                            value={formData.displayOrder}
                            onChange={(e) => setFormData(prev => ({ ...prev, displayOrder: parseInt(e.target.value) || 0 }))}
                            className="input-field"
                            min="0"
                        />
                    </div>

                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Settings
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.metadata.allowCustomServices}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        metadata: { ...prev.metadata, allowCustomServices: e.target.checked }
                                    }))}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Allow custom services</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.metadata.requiresSpecialLicense}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        metadata: { ...prev.metadata, requiresSpecialLicense: e.target.checked }
                                    }))}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Requires special license</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowEditModal(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={operationLoading.updating}
                            className="btn-primary"
                        >
                            {operationLoading.updating ? (
                                <div className="flex items-center">
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Updating...
                                </div>
                            ) : (
                                'Update Category'
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Business Category"
            >
                <div className="space-y-4">
                    <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-12 w-12 text-red-600" />
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Delete "{deletingCategory?.name}"?
                            </h3>
                            <p className="text-sm text-gray-500">
                                This action cannot be undone. This category will be permanently removed.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(false)}
                            className="btn-secondary"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteCategory}
                            disabled={operationLoading.deleting}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                            {operationLoading.deleting ? (
                                <div className="flex items-center">
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    Deleting...
                                </div>
                            ) : (
                                'Delete Category'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Stats Modal */}
            <Modal
                isOpen={showStatsModal}
                onClose={() => setShowStatsModal(false)}
                title="Category Statistics"
                size="lg"
            >
                {statsLoading ? (
                    <div className="flex justify-center py-8">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : statsError ? (
                    <div className="text-center py-8">
                        <XMarkIcon className="mx-auto h-12 w-12 text-red-400" />
                        <p className="mt-2 text-sm text-red-600">{statsError}</p>
                    </div>
                ) : categoryStats ? (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {categoryStats.summary.totalCategories}
                                </div>
                                <div className="text-sm text-blue-600">Total Categories</div>
                            </div>
                            <div className="bg-green-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    {categoryStats.summary.activeCategories}
                                </div>
                                <div className="text-sm text-green-600">Active Categories</div>
                            </div>
                            <div className="bg-purple-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {categoryStats.summary.totalBusinesses}
                                </div>
                                <div className="text-sm text-purple-600">Total Businesses</div>
                            </div>
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {categoryStats.summary.categoriesWithBusinesses}
                                </div>
                                <div className="text-sm text-yellow-600">Categories in Use</div>
                            </div>
                        </div>

                        {/* Category Usage Table */}
                        <div>
                            <h4 className="text-lg font-medium text-gray-900 mb-4">
                                Category Usage
                            </h4>
                            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                                <table className="min-w-full divide-y divide-gray-300">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Businesses
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {categoryStats.categoryStats.map((category) => (
                                            <tr key={category._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {category.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        category.isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {category.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {category.businessCount}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(category.createdAt).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : null}
            </Modal>
        </div>
    );
};

export default BusinessCategoryManagement;