import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    BuildingOfficeIcon,
    UserIcon,
    EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    EyeIcon,
    EyeSlashIcon,
    CogIcon,
    CheckIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import { registerBusinessAdmin } from '../../store/slices/authSlice';

const BusinessAdminRegistrationForm = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isLoading } = useSelector((state) => state.auth);
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Steps configuration
    const steps = [
        { id: 1, title: 'Personal Details', icon: UserIcon, status: 'current' },
        { id: 2, title: 'Business Info', icon: BuildingOfficeIcon, status: 'pending' },
        { id: 3, title: 'Services & Hours', icon: CogIcon, status: 'pending' },
        { id: 4, title: 'Settings & Review', icon: CheckIcon, status: 'pending' },
    ];

    const [formData, setFormData] = useState({
        // Personal Information (for User account)
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',

        // Business Information (for Business document)
        businessName: '',
        businessType: 'veterinary',
        businessEmail: '',
        businessPhone: '',

        // Address Information
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'IND',

        // Additional Business Details
        description: '',
        website: '',
        logo: '',

        // Services (will be converted to proper format for database)
        selectedServices: [],

        // Working Hours (matching your schema)
        workingHours: {
            monday: { isOpen: true, open: '09:00', close: '17:00' },
            tuesday: { isOpen: true, open: '09:00', close: '17:00' },
            wednesday: { isOpen: true, open: '09:00', close: '17:00' },
            thursday: { isOpen: true, open: '09:00', close: '17:00' },
            friday: { isOpen: true, open: '09:00', close: '17:00' },
            saturday: { isOpen: true, open: '09:00', close: '15:00' },
            sunday: { isOpen: false, open: '10:00', close: '14:00' },
        },

        // Settings
        appointmentBookingWindow: 30,
        cancellationHours: 24,
        cancellationFeePercentage: 0,
        emailReminders: true,
        emailReminderHours: 24,
        smsReminders: false,
        smsReminderHours: 2,
        acceptCash: true,
        acceptCard: true,
        acceptOnline: true,
        subscriptionPlan: 'free'
    });

    const [errors, setErrors] = useState({});

    const businessTypes = [
        { value: 'veterinary', label: 'Veterinary Clinic' },
        { value: 'grooming', label: 'Pet Grooming' },
        { value: 'boarding', label: 'Pet Boarding' },
        { value: 'daycare', label: 'Pet Daycare' },
        { value: 'training', label: 'Pet Training' },
        { value: 'mobile_vet', label: 'Mobile Veterinary' },
        { value: 'animal_hospital', label: 'Animal Hospital' },
        { value: 'pet_store', label: 'Pet Store' },
        { value: 'other', label: 'Other' },
    ];

    const commonServices = [
        { name: 'Wellness Exams', category: 'veterinary', duration: 30, price: 1500 },
        { name: 'Vaccinations', category: 'veterinary', duration: 15, price: 800 },
        { name: 'Spay/Neuter', category: 'veterinary', duration: 120, price: 8000 },
        { name: 'Dental Care', category: 'veterinary', duration: 60, price: 3000 },
        { name: 'Full Grooming', category: 'grooming', duration: 90, price: 2000 },
        { name: 'Bath & Brush', category: 'grooming', duration: 45, price: 1200 },
        { name: 'Nail Trimming', category: 'grooming', duration: 15, price: 300 },
        { name: 'Overnight Boarding', category: 'boarding', duration: 1440, price: 1500 },
        { name: 'Daycare', category: 'daycare', duration: 480, price: 800 },
        { name: 'Basic Training', category: 'training', duration: 60, price: 1000 },
        { name: 'Emergency Care', category: 'veterinary', duration: 60, price: 5000 },
        { name: 'Surgery Consultation', category: 'veterinary', duration: 45, price: 2500 },
    ];

    // Update step status based on current step
    const getStepStatus = (stepId) => {
        if (stepId < currentStep) return 'completed';
        if (stepId === currentStep) return 'current';
        return 'pending';
    };

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

    const handleServiceToggle = (service) => {
        setFormData(prev => ({
            ...prev,
            selectedServices: prev.selectedServices.find(s => s.name === service.name)
                ? prev.selectedServices.filter(s => s.name !== service.name)
                : [...prev.selectedServices, {
                    name: service.name,
                    category: service.category,
                    duration: service.duration,
                    price: {
                        amount: service.price,
                        currency: 'INR'
                    },
                    description: '',
                    isActive: true
                }]
        }));
    };

    const handleWorkingHoursChange = (day, field, value) => {
        setFormData(prev => ({
            ...prev,
            workingHours: {
                ...prev.workingHours,
                [day]: {
                    ...prev.workingHours[day],
                    [field]: value
                }
            }
        }));
    };

    const validateStep = (step) => {
        const newErrors = {};

        if (step === 1) {
            // Personal Information Validation
            if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
            if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
            if (!formData.email.trim()) {
                newErrors.email = 'Email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = 'Email is invalid';
            }
            if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
            if (!formData.password) {
                newErrors.password = 'Password is required';
            } else if (formData.password.length < 8) {
                newErrors.password = 'Password must be at least 8 characters';
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        } else if (step === 2) {
            // Business Information Validation
            if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
            if (!formData.businessEmail.trim()) {
                newErrors.businessEmail = 'Business email is required';
            } else if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) {
                newErrors.businessEmail = 'Business email is invalid';
            }
            if (!formData.businessPhone.trim()) newErrors.businessPhone = 'Business phone is required';
            
            // Address Validation
            if (!formData.street.trim()) newErrors.street = 'Street address is required';
            if (!formData.city.trim()) newErrors.city = 'City is required';
            if (!formData.state.trim()) newErrors.state = 'State is required';
            if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        } else {
            toast.error('Please fix the errors before proceeding');
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleFinalSubmit = async () => {
        if (!validateStep(currentStep)) {
            toast.error('Please fix the errors before submitting');
            return;
        }

        try {
            // Prepare data for API call matching your backend expectations
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
                        description: formData.description,
                        logo: formData.logo,
                        website: formData.website,
                        email: formData.businessEmail,
                        phone: formData.businessPhone,
                        address: {
                            street: formData.street,
                            city: formData.city,
                            state: formData.state,
                            zipCode: formData.zipCode,
                            country: formData.country
                        }
                    },
                    services: formData.selectedServices,
                    schedule: {
                        timezone: 'Asia/Kolkata',
                        workingHours: formData.workingHours
                    },
                    settings: {
                        appointmentBookingWindow: formData.appointmentBookingWindow,
                        cancellationPolicy: {
                            hoursRequired: formData.cancellationHours,
                            feePercentage: formData.cancellationFeePercentage
                        },
                        autoReminders: {
                            email: {
                                enabled: formData.emailReminders,
                                hoursBefore: formData.emailReminderHours
                            },
                            sms: {
                                enabled: formData.smsReminders,
                                hoursBefore: formData.smsReminderHours
                            }
                        },
                        paymentMethods: {
                            cash: formData.acceptCash,
                            card: formData.acceptCard,
                            online: formData.acceptOnline
                        }
                    },
                    subscription: {
                        plan: formData.subscriptionPlan,
                        status: 'active'
                    }
                }
            };

            // Dispatch the new registerBusinessAdmin action
            const result = await dispatch(registerBusinessAdmin(registrationPayload)).unwrap();

            toast.success('Business admin and business created successfully!');
            navigate('/dashboard');

        } catch (error) {
            toast.error(error.message || 'Registration failed');
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        // Prevent form submission, handle navigation instead
        if (currentStep < 4) {
            handleNext();
        } else {
            handleFinalSubmit();
        }
    };

    // Stepper Component
    const StepperComponent = () => (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
                {steps.map((step, stepIdx) => {
                    const status = getStepStatus(step.id);
                    const IconComponent = step.icon;
                    
                    return (
                        <React.Fragment key={step.id}>
                            <div className="flex flex-col items-center">
                                <div className={`
                                    flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200
                                    ${status === 'completed' 
                                        ? 'bg-green-500 border-green-500 text-white' 
                                        : status === 'current'
                                        ? 'bg-blue-500 border-blue-500 text-white'
                                        : 'bg-white border-gray-300 text-gray-400'
                                    }
                                `}>
                                    {status === 'completed' ? (
                                        <CheckIcon className="h-6 w-6" />
                                    ) : (
                                        <IconComponent className="h-6 w-6" />
                                    )}
                                </div>
                                <div className="mt-3 text-center">
                                    <div className={`text-sm font-medium ${
                                        status === 'current' ? 'text-blue-600' : 
                                        status === 'completed' ? 'text-green-600' : 'text-gray-500'
                                    }`}>
                                        STEP {step.id}
                                    </div>
                                    <div className={`text-sm ${
                                        status === 'current' ? 'text-blue-900 font-medium' : 
                                        status === 'completed' ? 'text-green-900' : 'text-gray-500'
                                    }`}>
                                        {step.title}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {status === 'completed' ? 'Completed' : 
                                         status === 'current' ? 'In Progress' : 'Pending'}
                                    </div>
                                </div>
                            </div>
                            
                            {stepIdx < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-4 mt-6 transition-all duration-200 ${
                                    step.id < currentStep ? 'bg-green-500' : 'bg-gray-300'
                                }`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );

    // Step Content Components
    const renderStep1 = () => (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                            placeholder="Enter first name"
                        />
                        {errors.firstName && (
                            <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name *
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                            placeholder="Enter last name"
                        />
                        {errors.lastName && (
                            <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address *
                        </label>
                        <div className="relative">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`input-field pl-10 ${errors.email ? 'border-red-500' : ''}`}
                                placeholder="Enter email address"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number *
                        </label>
                        <div className="relative">
                            <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`input-field pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                                placeholder="Enter phone number"
                            />
                        </div>
                        {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
                                placeholder="Enter password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm Password *
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className={`input-field pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                placeholder="Confirm password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-8">
            {/* Business Information Section */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 mr-2" />
                    Business Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name *
                        </label>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleInputChange}
                            className={`input-field ${errors.businessName ? 'border-red-500' : ''}`}
                            placeholder="Enter business name"
                        />
                        {errors.businessName && (
                            <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Type *
                        </label>
                        <select
                            name="businessType"
                            value={formData.businessType}
                            onChange={handleInputChange}
                            className="input-field"
                        >
                            {businessTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Email *
                        </label>
                        <div className="relative">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="email"
                                name="businessEmail"
                                value={formData.businessEmail}
                                onChange={handleInputChange}
                                className={`input-field pl-10 ${errors.businessEmail ? 'border-red-500' : ''}`}
                                placeholder="Enter business email"
                            />
                        </div>
                        {errors.businessEmail && (
                            <p className="text-red-500 text-sm mt-1">{errors.businessEmail}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Phone *
                        </label>
                        <div className="relative">
                            <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                            <input
                                type="tel"
                                name="businessPhone"
                                value={formData.businessPhone}
                                onChange={handleInputChange}
                                className={`input-field pl-10 ${errors.businessPhone ? 'border-red-500' : ''}`}
                                placeholder="Enter business phone"
                            />
                        </div>
                        {errors.businessPhone && (
                            <p className="text-red-500 text-sm mt-1">{errors.businessPhone}</p>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website
                        </label>
                        <input
                            type="url"
                            name="website"
                            value={formData.website}
                            onChange={handleInputChange}
                            className="input-field"
                            placeholder="https://www.example.com"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="input-field"
                            placeholder="Describe your business and services..."
                        />
                    </div>
                </div>
            </div>

            {/* Address Information Section */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    Business Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address *
                        </label>
                        <input
                            type="text"
                            name="street"
                            value={formData.street}
                            onChange={handleInputChange}
                            className={`input-field ${errors.street ? 'border-red-500' : ''}`}
                            placeholder="Enter street address"
                        />
                        {errors.street && (
                            <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            City *
                        </label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            className={`input-field ${errors.city ? 'border-red-500' : ''}`}
                            placeholder="Enter city"
                        />
                        {errors.city && (
                            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            State *
                        </label>
                        <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            className={`input-field ${errors.state ? 'border-red-500' : ''}`}
                            placeholder="Enter state"
                        />
                        {errors.state && (
                            <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            ZIP Code *
                        </label>
                        <input
                            type="text"
                            name="zipCode"
                            value={formData.zipCode}
                            onChange={handleInputChange}
                            className={`input-field ${errors.zipCode ? 'border-red-500' : ''}`}
                            placeholder="Enter ZIP code"
                        />
                        {errors.zipCode && (
                            <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country *
                        </label>
                        <select
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="input-field"
                        >
                            <option value="IND">India</option>
                            <option value="USA">United States</option>
                            <option value="CAN">Canada</option>
                            <option value="GBR">United Kingdom</option>
                            <option value="AUS">Australia</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-8">
            {/* Services Section */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Services Offered
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {commonServices.map(service => (
                        <label key={service.name} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={formData.selectedServices.find(s => s.name === service.name) !== undefined}
                                onChange={() => handleServiceToggle(service)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 mt-1"
                            />
                            <div className="ml-3 flex-1">
                                <span className="text-sm font-medium text-gray-900">{service.name}</span>
                                <div className="text-xs text-gray-500">
                                    <span className="inline-block mr-3">₹{service.price}</span>
                                    <span className="inline-block mr-3">{service.duration} min</span>
                                    <span className="inline-block capitalize bg-gray-100 px-2 py-1 rounded">{service.category}</span>
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            {/* Working Hours Section */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Working Hours
                </h2>
                <div className="space-y-4">
                    {Object.entries(formData.workingHours).map(([day, hours]) => (
                        <div key={day} className="flex items-center space-x-4">
                            <div className="w-24">
                                <span className="text-sm font-medium text-gray-700 capitalize">
                                    {day}
                                </span>
                            </div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={!hours.isOpen}
                                    onChange={(e) => handleWorkingHoursChange(day, 'isOpen', !e.target.checked)}
                                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Closed</span>
                            </label>
                            {hours.isOpen && (
                                <>
                                    <div>
                                        <input
                                            type="time"
                                            value={hours.open}
                                            onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                                            className="input-field w-32"
                                        />
                                    </div>
                                    <span className="text-sm text-gray-500">to</span>
                                    <div>
                                        <input
                                            type="time"
                                            value={hours.close}
                                            onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                                            className="input-field w-32"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-8">
            {/* Business Settings Section */}
            <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Business Settings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Appointment Booking Window (days in advance)
                        </label>
                        <input
                            type="number"
                            name="appointmentBookingWindow"
                            value={formData.appointmentBookingWindow}
                            onChange={handleInputChange}
                            min="1"
                            max="365"
                            className="input-field"
                            placeholder="30"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cancellation Notice Required (hours)
                        </label>
                        <input
                            type="number"
                            name="cancellationHours"
                            value={formData.cancellationHours}
                            onChange={handleInputChange}
                            min="0"
                            max="168"
                            className="input-field"
                            placeholder="24"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cancellation Fee (% of service cost)
                        </label>
                        <input
                            type="number"
                            name="cancellationFeePercentage"
                            value={formData.cancellationFeePercentage}
                            onChange={handleInputChange}
                            min="0"
                            max="100"
                            className="input-field"
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Subscription Plan
                        </label>
                        <select
                            name="subscriptionPlan"
                            value={formData.subscriptionPlan}
                            onChange={handleInputChange}
                            className="input-field"
                        >
                            <option value="free">Free Plan</option>
                            <option value="basic">Basic Plan</option>
                            <option value="premium">Premium Plan</option>
                        </select>
                    </div>
                </div>

                {/* Reminder Settings */}
                <div className="mt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Reminder Settings</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="emailReminders"
                                        checked={formData.emailReminders}
                                        onChange={(e) => setFormData(prev => ({ ...prev, emailReminders: e.target.checked }))}
                                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Email Reminders</span>
                                </label>
                            </div>
                            {formData.emailReminders && (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        name="emailReminderHours"
                                        value={formData.emailReminderHours}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="168"
                                        className="input-field w-20"
                                    />
                                    <span className="text-sm text-gray-500">hours before</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="smsReminders"
                                        checked={formData.smsReminders}
                                        onChange={(e) => setFormData(prev => ({ ...prev, smsReminders: e.target.checked }))}
                                        className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">SMS Reminders</span>
                                </label>
                            </div>
                            {formData.smsReminders && (
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="number"
                                        name="smsReminderHours"
                                        value={formData.smsReminderHours}
                                        onChange={handleInputChange}
                                        min="1"
                                        max="48"
                                        className="input-field w-20"
                                    />
                                    <span className="text-sm text-gray-500">hours before</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div className="mt-6">
                    <h3 className="text-md font-medium text-gray-900 mb-3">Accepted Payment Methods</h3>
                    <div className="space-y-2">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="acceptCash"
                                checked={formData.acceptCash}
                                onChange={(e) => setFormData(prev => ({ ...prev, acceptCash: e.target.checked }))}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Cash</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="acceptCard"
                                checked={formData.acceptCard}
                                onChange={(e) => setFormData(prev => ({ ...prev, acceptCard: e.target.checked }))}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Credit/Debit Card</span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="acceptOnline"
                                checked={formData.acceptOnline}
                                onChange={(e) => setFormData(prev => ({ ...prev, acceptOnline: e.target.checked }))}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-700">Online Payment (UPI/Net Banking)</span>
                        </label>
                    </div>
                </div>

                {/* Review Section */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-md font-medium text-gray-900 mb-4">Review Your Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-gray-700">Admin Name:</span>
                            <span className="ml-2 text-gray-600">{formData.firstName} {formData.lastName}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Email:</span>
                            <span className="ml-2 text-gray-600">{formData.email}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Business:</span>
                            <span className="ml-2 text-gray-600">{formData.businessName}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="ml-2 text-gray-600 capitalize">{formData.businessType}</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Services:</span>
                            <span className="ml-2 text-gray-600">{formData.selectedServices.length} selected</span>
                        </div>
                        <div>
                            <span className="font-medium text-gray-700">Plan:</span>
                            <span className="ml-2 text-gray-600 capitalize">{formData.subscriptionPlan}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            case 4:
                return renderStep4();
            default:
                return renderStep1();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Register New Business Admin
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Create a new business admin account and setup their business profile
                    </p>
                </div>

                {/* Stepper */}
                <StepperComponent />

                {/* Form */}
                <div className="bg-white shadow-xl rounded-lg">
                    <form onSubmit={handleFormSubmit} className="px-6 py-8">
                        {/* Current Step Content */}
                        {renderCurrentStep()}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-8 border-t border-gray-200 mt-8">
                            <button
                                type="button"
                                onClick={handlePrevious}
                                disabled={currentStep === 1}
                                className={`flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
                                    currentStep === 1 
                                        ? 'text-gray-400 cursor-not-allowed' 
                                        : 'text-gray-700 bg-white hover:bg-gray-50'
                                }`}
                            >
                                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                                Previous
                            </button>

                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={() => navigate('/dashboard')}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                
                                {currentStep < 4 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                                    >
                                        Next
                                        <ArrowRightIcon className="h-4 w-4 ml-2" />
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleFinalSubmit}
                                        disabled={isLoading}
                                        className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
                                        Create Business Admin
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BusinessAdminRegistrationForm;