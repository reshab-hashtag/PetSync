// client/src/components/auth/BusinessAdminRegistrationForm.jsx (Fixed Submission Flow)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchActiveCategories,
    selectActiveCategories,
    selectActiveCategoriesLoading,
    selectActiveCategoriesError
} from '../../store/slices/businessCategorySlice';
// Import the createBusiness action from your business slice
import { createBusiness } from '../../store/slices/businessSlice'; // Adjust path as needed
import {
    BuildingOfficeIcon,
    UserIcon,
    MapPinIcon,
    CogIcon,
    CheckCircleIcon,
    XCircleIcon,
    Squares2X2Icon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';

const BusinessAdminRegistrationForm = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Redux state
    const categories = useSelector(selectActiveCategories);
    const categoriesLoading = useSelector(selectActiveCategoriesLoading);
    const categoriesError = useSelector(selectActiveCategoriesError);

    // Form state
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        // Personal Information
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',

        // Business Information
        businessName: '',
        companyName: '',
        businessEmail: '',
        businessPhone: '',
        description: '',
        website: '',
        category: '', // This will be BusinessCategory ObjectId

        // Address
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'IND',

        // Services - simplified for now
        selectedServices: []
    });

    // Load categories on component mount
    useEffect(() => {
        dispatch(fetchActiveCategories());
    }, [dispatch]);

    // Steps configuration
    const steps = [
        {
            id: 1,
            name: 'Personal',
            icon: UserIcon,
            description: 'Your details'
        },
        {
            id: 2,
            name: 'Business',
            icon: BuildingOfficeIcon,
            description: 'Business info'
        },
        {
            id: 3,
            name: 'Address',
            icon: MapPinIcon,
            description: 'Location'
        },
        {
            id: 4,
            name: 'Review',
            icon: CheckCircleIcon,
            description: 'Confirm'
        }
    ];

    // Get step status
    const getStepStatus = (stepId) => {
        if (stepId < currentStep) return 'completed';
        if (stepId === currentStep) return 'current';
        return 'pending';
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Handle category selection
    const handleCategorySelect = (categoryId) => {
        setFormData(prev => ({
            ...prev,
            category: categoryId
        }));

        if (errors.category) {
            setErrors(prev => ({
                ...prev,
                category: ''
            }));
        }
    };

    // Validation functions
    const validateStep1 = () => {
        const newErrors = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!formData.password) newErrors.password = 'Password is required';
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};

        if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.businessEmail.trim()) newErrors.businessEmail = 'Business email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) newErrors.businessEmail = 'Business email is invalid';
        if (!formData.businessPhone.trim()) newErrors.businessPhone = 'Business phone is required';
        if (!formData.category) newErrors.category = 'Please select a business category';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep3 = () => {
        const newErrors = {};

        if (!formData.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Navigation handlers
    const handleNext = () => {
        let isValid = false;

        switch (currentStep) {
            case 1:
                isValid = validateStep1();
                break;
            case 2:
                isValid = validateStep2();
                break;
            case 3:
                isValid = validateStep3();
                break;
            default:
                isValid = true;
        }

        if (isValid && currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    // Form submission using Redux createBusiness action
    const handleSubmit = async () => {
        // Final validation before submission
        if (!validateStep1() || !validateStep2() || !validateStep3()) {
            // If validation fails, go back to the first step with errors
            setCurrentStep(1);
            return;
        }

        setLoading(true);

        try {
            // Use the registration payload structure
            const registrationPayload = {
                // User data (business admin personal info)
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                password: formData.password,
                phone: formData.phone,
                role: 'business_admin', // Fixed role

                // Business data matching your Business schema
                businessData: {
                    profile: {
                        name: formData.businessName,
                        companyName: formData.companyName,  // Added missing companyName
                        description: formData.description || '',
                        logo: '', // Default empty, can be added later
                        website: formData.website || '',
                        email: formData.businessEmail,
                        phone: formData.businessPhone,
                        category: formData.category, // Add the category field
                        address: {
                            street: formData.street,
                            city: formData.city,
                            state: formData.state,
                            zipCode: formData.zipCode,
                            country: formData.country
                        }
                    },
                    services: formData.selectedServices || [], // Default to empty array
                    schedule: {
                        timezone: 'Asia/Kolkata',
                        workingHours: {
                            // Default working hours since not collected in form
                            monday: { isOpen: true, open: '09:00', close: '17:00' },
                            tuesday: { isOpen: true, open: '09:00', close: '17:00' },
                            wednesday: { isOpen: true, open: '09:00', close: '17:00' },
                            thursday: { isOpen: true, open: '09:00', close: '17:00' },
                            friday: { isOpen: true, open: '09:00', close: '17:00' },
                            saturday: { isOpen: true, open: '09:00', close: '15:00' },
                            sunday: { isOpen: false, open: '10:00', close: '14:00' }
                        }
                    },
                    settings: {
                        appointmentBookingWindow: 30, // Default values since not in form
                        cancellationPolicy: {
                            hoursRequired: 24,
                            feePercentage: 0
                        },
                        autoReminders: {
                            email: {
                                enabled: true,
                                hoursBefore: 24
                            },
                            sms: {
                                enabled: false,
                                hoursBefore: 2
                            }
                        },
                        paymentMethods: {
                            cash: true,
                            card: true,
                            online: true
                        }
                    },
                    subscription: {
                        plan: 'free', // Default plan
                        status: 'active'
                    }
                }
            };

            await dispatch(createBusiness(registrationPayload)).unwrap();

            // Success - redirect to login or dashboard
            // navigate('/login', {
            //     state: {
            //         message: 'Registration successful! Please log in with your credentials.',
            //         type: 'success'
            //     }
            // });
        } catch (error) {
            console.error('Registration error:', error);
            setErrors({ general: error || 'Registration failed. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    // Get selected category for display
    const selectedCategory = categories.find(cat => cat._id === formData.category);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <BuildingOfficeIcon className="h-12 w-12 text-indigo-600" />
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Register Your Business
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Join PetSync CRM and manage your pet business efficiently
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* Progress Steps - Fixed for responsiveness */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                            {steps.map((step, index) => (
                                <div key={step.id} className="flex items-center w-full sm:w-auto">
                                    <div className="flex items-center">
                                        <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${getStepStatus(step.id) === 'completed'
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : getStepStatus(step.id) === 'current'
                                                    ? 'border-indigo-600 text-indigo-600'
                                                    : 'border-gray-300 text-gray-400'
                                            }`}>
                                            {getStepStatus(step.id) === 'completed' ? (
                                                <CheckCircleIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                                            ) : (
                                                <span className="text-xs sm:text-sm font-medium">{step.id}</span>
                                            )}
                                        </div>
                                        <div className="ml-2 sm:ml-3">
                                            <p className={`text-xs sm:text-sm font-medium ${getStepStatus(step.id) === 'current'
                                                    ? 'text-indigo-600'
                                                    : getStepStatus(step.id) === 'completed'
                                                        ? 'text-green-600'
                                                        : 'text-gray-400'
                                                }`}>
                                                {step.name}
                                            </p>
                                            <p className="text-xs text-gray-500 hidden sm:block">{step.description}</p>
                                        </div>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`hidden sm:block ml-4 w-8 lg:w-16 h-0.5 ${getStepStatus(step.id) === 'completed'
                                                ? 'bg-indigo-600'
                                                : 'bg-gray-300'
                                            }`} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Display */}
                    {errors.general && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-red-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-red-800">{errors.general}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Categories Error Display */}
                    {categoriesError && (
                        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
                            <div className="flex">
                                <XCircleIcon className="h-5 w-5 text-yellow-400" />
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-800">
                                        Failed to load categories. Using default options.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Form Content - NOT wrapped in form tag to prevent auto-submission */}
                    <div>
                        {/* Step 1: Personal Information */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            First Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.firstName ? 'border-red-300' : ''}`}
                                            placeholder="John"
                                        />
                                        {errors.firstName && (
                                            <p className="mt-2 text-sm text-red-600">{errors.firstName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Last Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.lastName ? 'border-red-300' : ''}`}
                                            placeholder="Doe"
                                        />
                                        {errors.lastName && (
                                            <p className="mt-2 text-sm text-red-600">{errors.lastName}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className={`input-field ${errors.email ? 'border-red-300' : ''}`}
                                        placeholder="john@example.com"
                                    />
                                    {errors.email && (
                                        <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Phone Number *
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`input-field ${errors.phone ? 'border-red-300' : ''}`}
                                        placeholder="+1234567890"
                                    />
                                    {errors.phone && (
                                        <p className="mt-2 text-sm text-red-600">{errors.phone}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Password *
                                        </label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.password ? 'border-red-300' : ''}`}
                                            placeholder="••••••••"
                                        />
                                        {errors.password && (
                                            <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Confirm Password *
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.confirmPassword ? 'border-red-300' : ''}`}
                                            placeholder="••••••••"
                                        />
                                        {errors.confirmPassword && (
                                            <p className="mt-2 text-sm text-red-600">{errors.confirmPassword}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Business Information */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Business Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="businessName"
                                            value={formData.businessName}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.businessName ? 'border-red-300' : ''}`}
                                            placeholder="Happy Paws Grooming"
                                        />
                                        {errors.businessName && (
                                            <p className="mt-2 text-sm text-red-600">{errors.businessName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Company Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.companyName ? 'border-red-300' : ''}`}
                                            placeholder="Happy Paws LLC"
                                        />
                                        {errors.companyName && (
                                            <p className="mt-2 text-sm text-red-600">{errors.companyName}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Business Email *
                                        </label>
                                        <input
                                            type="email"
                                            name="businessEmail"
                                            value={formData.businessEmail}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.businessEmail ? 'border-red-300' : ''}`}
                                            placeholder="info@happypaws.com"
                                        />
                                        {errors.businessEmail && (
                                            <p className="mt-2 text-sm text-red-600">{errors.businessEmail}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Business Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            name="businessPhone"
                                            value={formData.businessPhone}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.businessPhone ? 'border-red-300' : ''}`}
                                            placeholder="+1987654321"
                                        />
                                        {errors.businessPhone && (
                                            <p className="mt-2 text-sm text-red-600">{errors.businessPhone}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Website (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                        className="input-field"
                                        placeholder="https://www.happypaws.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Category *
                                    </label>
                                    {categoriesLoading ? (
                                        <div className="flex items-center justify-center py-3 px-4 border border-gray-300 rounded-md bg-gray-50">
                                            <LoadingSpinner size="sm" />
                                            <span className="ml-2 text-sm text-gray-500">Loading categories...</span>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <select
                                                value={formData.category || ''}
                                                onChange={(e) => handleCategorySelect(e.target.value)}
                                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${errors.category
                                                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300'
                                                    }`}
                                                required
                                            >
                                                <option value="">Select a business category...</option>
                                                {categories.map((category) => (
                                                    <option key={category._id} value={category._id}>
                                                        {category.name}
                                                        {category.description && ` - ${category.description.slice(0, 50)}${category.description.length > 50 ? '...' : ''}`}
                                                    </option>
                                                ))}
                                            </select>

                                            {/* Selected category preview */}
                                            {formData.category && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-md border">
                                                    {(() => {
                                                        const selectedCategory = categories.find(cat => cat._id === formData.category);
                                                        return selectedCategory ? (
                                                            <div className="flex items-center">
                                                                <div
                                                                    className="w-6 h-6 rounded flex items-center justify-center text-white mr-2 flex-shrink-0"
                                                                    style={{ backgroundColor: selectedCategory.color }}
                                                                >
                                                                    <Squares2X2Icon className="h-3 w-3" />
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">
                                                                        {selectedCategory.name}
                                                                    </p>
                                                                    {selectedCategory.description && (
                                                                        <p className="text-xs text-gray-600 mt-1">
                                                                            {selectedCategory.description}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : null;
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {errors.category && (
                                        <p className="mt-2 text-sm text-red-600">{errors.category}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Business Description (Optional)
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="input-field"
                                        placeholder="Brief description of your business and services..."
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Address */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Business Address</h3>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Street Address *
                                    </label>
                                    <input
                                        type="text"
                                        name="street"
                                        value={formData.street}
                                        onChange={handleInputChange}
                                        className={`input-field ${errors.street ? 'border-red-300' : ''}`}
                                        placeholder="123 Main Street"
                                    />
                                    {errors.street && (
                                        <p className="mt-2 text-sm text-red-600">{errors.street}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.city ? 'border-red-300' : ''}`}
                                            placeholder="Mumbai"
                                        />
                                        {errors.city && (
                                            <p className="mt-2 text-sm text-red-600">{errors.city}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            State *
                                        </label>
                                        <input
                                            type="text"
                                            name="state"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.state ? 'border-red-300' : ''}`}
                                            placeholder="Maharashtra"
                                        />
                                        {errors.state && (
                                            <p className="mt-2 text-sm text-red-600">{errors.state}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            ZIP/Postal Code *
                                        </label>
                                        <input
                                            type="text"
                                            name="zipCode"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            className={`input-field ${errors.zipCode ? 'border-red-300' : ''}`}
                                            placeholder="400001"
                                        />
                                        {errors.zipCode && (
                                            <p className="mt-2 text-sm text-red-600">{errors.zipCode}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Country
                                        </label>
                                        <select
                                            name="country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                            className="input-field"
                                        >
                                            <option value="IND">India</option>
                                            <option value="US">United States</option>
                                            <option value="CA">Canada</option>
                                            <option value="GB">United Kingdom</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Information</h3>
                                    <p className="text-sm text-gray-600">
                                        Please review all the information before submitting your registration.
                                    </p>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p>{formData.firstName} {formData.lastName}</p>
                                            <p>{formData.email}</p>
                                            <p>{formData.phone}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <h4 className="text-sm font-medium text-gray-900">Business Information</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p><strong>Business:</strong> {formData.businessName}</p>
                                            <p><strong>Company:</strong> {formData.companyName}</p>
                                            <p><strong>Email:</strong> {formData.businessEmail}</p>
                                            <p><strong>Phone:</strong> {formData.businessPhone}</p>
                                            {selectedCategory && (
                                                <p><strong>Category:</strong> {selectedCategory.name}</p>
                                            )}
                                            {formData.website && (
                                                <p><strong>Website:</strong> {formData.website}</p>
                                            )}
                                            {formData.description && (
                                                <p><strong>Description:</strong> {formData.description}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        <h4 className="text-sm font-medium text-gray-900">Business Address</h4>
                                        <div className="mt-2 text-sm text-gray-600">
                                            <p>{formData.street}</p>
                                            <p>{formData.city}, {formData.state} {formData.zipCode}</p>
                                            <p>{formData.country}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                                className={`px-4 py-2 text-sm font-medium rounded-md ${currentStep === 1
                                        ? 'text-gray-400 cursor-not-allowed'
                                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                Previous
                            </button>

                            {currentStep < steps.length ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="btn-primary"
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="btn-primary"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
                                            <LoadingSpinner size="sm" className="mr-2" />
                                            Registering...
                                        </div>
                                    ) : (
                                        'Complete Registration'
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessAdminRegistrationForm;