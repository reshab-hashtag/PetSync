// client/src/components/clients/ClientRegistrationForm.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
    UserIcon,
    LockClosedIcon,
    MapPinIcon,
    UserGroupIcon,
    CheckCircleIcon,
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import { registerClient } from '../../store/slices/clientSlice';
import toast from 'react-hot-toast';
import Step1 from './Steps/Step1';
import Step2 from './Steps/Step2';
import Step3 from './Steps/Step3';
import Step4 from './Steps/Step4';

const ClientRegistrationForm = ({ onClose, onSuccess }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'India'
        },
        emergencyContact: {
            name: '',
            phone: '',
            relationship: ''
        }
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completedSteps, setCompletedSteps] = useState(new Set());

    const dispatch = useDispatch();

    const steps = [
        {
            id: 1,
            name: 'Personal Info',
            description: 'Basic personal information',
            icon: UserIcon,
            color: 'blue'
        },
        {
            id: 2,
            name: 'Account Setup',
            description: 'Login credentials',
            icon: LockClosedIcon,
            color: 'green'
        },
        {
            id: 3,
            name: 'Address',
            description: 'Contact information',
            icon: MapPinIcon,
            color: 'purple'
        },
        {
            id: 4,
            name: 'Emergency Contact',
            description: 'Emergency contact details',
            icon: UserGroupIcon,
            color: 'orange'
        }
    ];

    const handleChange = (e) => {
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

    const validateStep = (step) => {
        switch (step) {
            case 1:
                if (!formData.firstName.trim()) {
                    toast.error('First name is required');
                    return false;
                }
                if (!formData.lastName.trim()) {
                    toast.error('Last name is required');
                    return false;
                }
                if (!formData.email.trim()) {
                    toast.error('Email is required');
                    return false;
                }
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    toast.error('Please enter a valid email address');
                    return false;
                }
                if (!formData.phone.trim()) {
                    toast.error('Phone number is required');
                    return false;
                }
                return true;
            case 2:
                if (!formData.password.trim()) {
                    toast.error('Password is required');
                    return false;
                }
                if (formData.password.length < 6) {
                    toast.error('Password must be at least 6 characters long');
                    return false;
                }
                if (formData.password !== formData.confirmPassword) {
                    toast.error('Passwords do not match');
                    return false;
                }
                return true;
            case 3:
            case 4:
                return true; // These steps are optional
            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCompletedSteps(prev => new Set([...prev, currentStep]));
            setCurrentStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleStepClick = (stepId) => {
        // Allow going to previous completed steps or next step
        if (stepId <= currentStep || completedSteps.has(stepId - 1)) {
            setCurrentStep(stepId);
        }
    };

    const handleFinalSubmit = async () => {
        // Validate required steps before final submission
        if (!validateStep(1) || !validateStep(2)) {
            toast.error('Please complete all required information');
            return;
        }

        setIsSubmitting(true);

        try {
            const clientData = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.toLowerCase().trim(),
                password: formData.password,
                phone: formData.phone.trim(),
                role: 'client',
                profile: {
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    email: formData.email.toLowerCase().trim(),
                    phone: formData.phone.trim(),
                    address: {
                        street: formData.address.street.trim(),
                        city: formData.address.city.trim(),
                        state: formData.address.state.trim(),
                        zipCode: formData.address.zipCode.trim(),
                        country: formData.address.country
                    }
                },
                emergencyContact: formData.emergencyContact.name.trim() ? {
                    name: formData.emergencyContact.name.trim(),
                    phone: formData.emergencyContact.phone.trim(),
                    relationship: formData.emergencyContact.relationship.trim()
                } : undefined
            };

            const result = await dispatch(registerClient(clientData)).unwrap();

            toast.success('Client registered successfully!');

            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                phone: '',
                address: {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'India'
                },
                emergencyContact: {
                    name: '',
                    phone: '',
                    relationship: ''
                }
            });
            setCurrentStep(1);
            setCompletedSteps(new Set());

            if (onSuccess) onSuccess(result);
            if (onClose) onClose();

        } catch (error) {
            toast.error(error || 'Failed to register client');
        } finally {
            setIsSubmitting(false);
        }
    };
    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1
                        formData={formData}
                        handleChange={handleChange}
                    />
                );

            case 2:
                return (
                    <Step2
                        showPassword={showPassword}
                        handleChange={handleChange}
                        formData={formData}
                        setShowPassword={setShowPassword}
                        showConfirmPassword={showConfirmPassword}
                        setShowConfirmPassword={setShowConfirmPassword}
                    />
                );

            case 3:
                return (
                    <Step3
                        formData={formData}
                        handleChange={handleChange}
                    />
                );

            case 4:
                return (
                    <Step4
                        formData={formData}
                        handleChange={handleChange}
                    />
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-start justify-center pt-20 pb-8">
            <div className="relative w-full max-w-5xl mx-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-t-xl px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                                <UserIcon className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white">Register New Client</h3>
                                <p className="text-blue-100 text-sm">Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.description}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-blue-200 transition-colors duration-200 p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="bg-white rounded-b-xl shadow-2xl">
                    <div className="p-8">
                        {/* Stepper */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between relative">
                                {steps.map((step, index) => (
                                    <React.Fragment key={step.id}>
                                        {/* Step Circle and Content */}
                                        <div className="flex flex-col items-center relative z-10">
                                            {/* Circle */}
                                            <div
                                                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 cursor-pointer ${completedSteps.has(step.id)
                                                    ? 'bg-emerald-500 border-emerald-500'
                                                    : step.id === currentStep
                                                        ? 'bg-blue-500 border-blue-500'
                                                        : 'bg-blue-100 border-blue-200'
                                                    }`}
                                                onClick={() => handleStepClick(step.id)}
                                            >
                                                {completedSteps.has(step.id) ? (
                                                    <CheckIcon className="w-6 h-6 text-white" />
                                                ) : (
                                                    <div
                                                        className={`w-3 h-3 rounded-full ${step.id === currentStep
                                                            ? 'bg-white'
                                                            : 'bg-blue-400'
                                                            }`}
                                                    />
                                                )}
                                            </div>

                                            {/* Step Info */}
                                            <div className="mt-4 text-center">
                                                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-1">
                                                    STEP {step.id}
                                                </div>
                                                <div
                                                    className={`text-sm font-semibold ${completedSteps.has(step.id)
                                                        ? 'text-gray-900'
                                                        : step.id === currentStep
                                                            ? 'text-gray-900'
                                                            : 'text-gray-400'
                                                        }`}
                                                >
                                                    {step.name}
                                                </div>
                                                <div
                                                    className={`text-xs mt-1 ${completedSteps.has(step.id)
                                                        ? 'text-emerald-600'
                                                        : step.id === currentStep
                                                            ? 'text-blue-600'
                                                            : 'text-gray-400'
                                                        }`}
                                                >
                                                    {completedSteps.has(step.id)
                                                        ? 'Completed'
                                                        : step.id === currentStep
                                                            ? 'In Progress'
                                                            : 'Pending'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Connecting Line */}
                                        {index < steps.length - 1 && (
                                            <div className="flex-1 h-0.5 mx-6 relative -mt-16">
                                                <div
                                                    className={`h-full transition-all duration-300 ${completedSteps.has(step.id)
                                                        ? 'bg-emerald-500'
                                                        : 'bg-blue-200'
                                                        }`}
                                                />
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Current Step Content */}
                            <div className="min-h-96">
                                <div className="flex items-center space-x-3 mb-6">
                                    <div className={`w-8 h-8 bg-${steps[currentStep - 1]?.color}-100 rounded-lg flex items-center justify-center`}>
                                        {React.createElement(steps[currentStep - 1]?.icon, {
                                            className: `w-5 h-5 text-${steps[currentStep - 1]?.color}-600`
                                        })}
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900">{steps[currentStep - 1]?.name}</h4>
                                    {currentStep > 2 && <span className="text-sm text-gray-500">(Optional)</span>}
                                </div>

                                {renderStepContent()}
                            </div>

                            {/* Navigation Buttons */}
                            <div className="flex justify-between items-center pt-8 border-t border-gray-200">
                                <div className="flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    {currentStep > 1 && (
                                        <button
                                            type="button"
                                            onClick={handlePrevious}
                                            className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center"
                                            disabled={isSubmitting}
                                        >
                                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                            Previous
                                        </button>
                                    )}
                                </div>

                                <div className="flex space-x-3">
                                    {currentStep < steps.length ? (
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 flex items-center"
                                            disabled={isSubmitting}
                                        >
                                            Next
                                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleFinalSubmit}
                                            disabled={isSubmitting}
                                            className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <LoadingSpinner size="sm" />
                                                    <span className="ml-2">Registering...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                                                    Register Client
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientRegistrationForm;