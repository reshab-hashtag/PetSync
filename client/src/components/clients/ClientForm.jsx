// client/src/components/clients/ClientForm.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import { updateClient } from '../../store/slices/clientSlice';
import toast from 'react-hot-toast';

const ClientForm = ({ client, isEdit = false, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    }
  });

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
      name: 'Contact Details',
      description: 'Phone and address information',
      icon: PhoneIcon,
      color: 'green'
    }
  ];

  useEffect(() => {
    if (isEdit && client) {
      setFormData({
        firstName: client.profile?.firstName || '',
        lastName: client.profile?.lastName || '',
        email: client.profile?.email || '',
        password: '',
        confirmPassword: '',
        phone: client.profile?.phone || '',
        address: {
          street: client.profile?.address?.street || '',
          city: client.profile?.address?.city || '',
          state: client.profile?.address?.state || '',
          zipCode: client.profile?.address?.zipCode || '',
          country: client.profile?.address?.country || 'India'
        }
      });
    }
  }, [isEdit, client]);

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
        if (!isEdit) {
          if (!formData.password) {
            toast.error('Password is required');
            return false;
          }
          if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            return false;
          }
          if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
          }
        } else {
          if (formData.password && formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return false;
          }
        }
        return true;

      case 2:
        if (!formData.phone.trim()) {
          toast.error('Phone number is required');
          return false;
        }
        if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
          toast.error('Please enter a valid phone number');
          return false;
        }
        return true;

      case 3:
        // Emergency contact is optional
        return true;

      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setLoading(true);
    try {
      const submitData = {
        profile: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email, // Email goes in profile
          phone: formData.phone,
          address: formData.address
        }
      };

      // Add password if provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      if (isEdit) {
        await dispatch(updateClient({ clientId: client.id, clientData: submitData })).unwrap();
        toast.success('Client updated successfully!');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} client`);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isEdit}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="Enter email address"
              />
              {isEdit && (
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed after registration</p>
              )}
            </div>

            {(!isEdit || formData.password) && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password {!isEdit && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required={!isEdit}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={isEdit ? "Leave blank to keep current password" : "Enter password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {!isEdit && (
                    <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters long</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password {!isEdit && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required={!isEdit || formData.password}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter street address"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter state"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="address.zipCode"
                  value={formData.address.zipCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter ZIP code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  name="address.country"
                  value={formData.address.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Client' : 'Add New Client'}
        </h2>
        <p className="text-gray-600 mt-1">
          {isEdit ? 'Update client information' : 'Enter client information to create their account'}
        </p>
      </div>

      {/* Step Progress */}
      <div className="mb-8">
        <ol className="flex items-center justify-center space-x-8">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                    step.id <= currentStep
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircleIcon className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    STEP {step.id}
                  </div>
                  <div
                    className={`text-sm font-medium mt-1 ${
                      step.id <= currentStep ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {step.name}
                  </div>
                </div>
              </div>
              {stepIdx !== steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-0.5 w-full ${
                      step.id < currentStep ? 'bg-blue-500' : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>

      {/* Step Content */}
      <div className="min-h-96 mb-8">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handlePrevious}
              className="btn-secondary flex items-center"
              disabled={loading}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </button>
          )}
        </div>

        <div className="flex space-x-3">
          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary flex items-center"
              disabled={loading}
            >
              Next
              <ArrowRightIcon className="h-4 w-4 ml-2" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">{isEdit ? 'Updating...' : 'Creating...'}</span>
                </>
              ) : (
                isEdit ? 'Update Client' : 'Create Client'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientForm;