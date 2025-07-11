import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createService, updateService } from '../../store/slices/serviceSlice';
import {
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../common/LoadingSpinner';
import { fetchStaffMembersWithBusinesses } from '../../store/slices/staffSlice';

const ServiceForm = ({ service, onClose, onSave }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.services);
  const { businesses, loading: businessLoading } = useSelector((state) => state.business);

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState({
    business: '',
    name: '',
    description: '',
    category: 'grooming',
    pricing: {
      basePrice: '',
      currency: 'INR',
      priceType: 'fixed',
      variations: []
    },
    duration: {
      estimated: '',
      buffer: 15
    },
    requirements: {
      vaccinationRequired: false,
      requiredVaccines: [],
      ageRestrictions: {
        minAge: '',
        maxAge: ''
      },
      specialRequirements: []
    },
    staff: [],
    isActive: true
  });

  const [staffMembers, setStaffMembers] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [businessesLoading, setBusinessesLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { number: 1, title: 'Business', icon: '🏢' },
    { number: 2, title: 'Basic Info', icon: '📋' },
    { number: 3, title: 'Pricing', icon: '💰' },
    { number: 4, title: 'Duration', icon: '⏱️' },
    { number: 5, title: 'Requirements', icon: '📌' },
    { number: 6, title: 'Staff', icon: '👥' }
  ];

  useEffect(() => {
    const loadStaffMembers = async () => {
      try {
        setStaffLoading(true);
        const response = await dispatch(fetchStaffMembersWithBusinesses({
          role: 'staff',
          isActive: true,
          limit: 100
        }));
        
        setStaffMembers(response.payload?.staff || []);
      } catch (error) {
        console.error('Failed to load staff members:', error);
        setStaffMembers([]);
      } finally {
        setStaffLoading(false);
      }
    };

    loadStaffMembers();

    if (service) {
      setFormData({
        business: service.business?._id || service.business || '',
        name: service.name || '',
        description: service.description || '',
        category: service.category || 'grooming',
        pricing: {
          basePrice: service.pricing?.basePrice || '',
          currency: service.pricing?.currency || 'INR',
          priceType: service.pricing?.priceType || 'fixed',
          variations: service.pricing?.variations || []
        },
        duration: {
          estimated: service.duration?.estimated || '',
          buffer: service.duration?.buffer || 15
        },
        requirements: {
          vaccinationRequired: service.requirements?.vaccinationRequired || false,
          requiredVaccines: service.requirements?.requiredVaccines || [],
          ageRestrictions: {
            minAge: service.requirements?.ageRestrictions?.minAge || '',
            maxAge: service.requirements?.ageRestrictions?.maxAge || ''
          },
          specialRequirements: service.requirements?.specialRequirements || []
        },
        staff: service.staff ? 
          service.staff.map(s => typeof s === 'string' ? s : (s.user || s._id || s)) : [],
        isActive: service.isActive !== undefined ? service.isActive : true
      });
    }
  }, [dispatch, service]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const keys = name.split('.');

    if (keys.length === 1) {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    } else if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (keys.length === 3) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0]],
          [keys[1]]: {
            ...prev[keys[0]][keys[1]],
            [keys[2]]: type === 'checkbox' ? checked : value
          }
        }
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const addPriceVariation = () => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        variations: [
          ...prev.pricing.variations,
          { name: '', price: '', conditions: '' }
        ]
      }
    }));
  };

  const removePriceVariation = (index) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        variations: prev.pricing.variations.filter((_, i) => i !== index)
      }
    }));
  };

  const updatePriceVariation = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        variations: prev.pricing.variations.map((variation, i) =>
          i === index ? { ...variation, [field]: value } : variation
        )
      }
    }));
  };

  const addRequiredVaccine = () => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        requiredVaccines: [...prev.requirements.requiredVaccines, '']
      }
    }));
  };

  const removeRequiredVaccine = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        requiredVaccines: prev.requirements.requiredVaccines.filter((_, i) => i !== index)
      }
    }));
  };

  const updateRequiredVaccine = (index, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        requiredVaccines: prev.requirements.requiredVaccines.map((vaccine, i) =>
          i === index ? value : vaccine
        )
      }
    }));
  };

  const addSpecialRequirement = () => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        specialRequirements: [...prev.requirements.specialRequirements, '']
      }
    }));
  };

  const removeSpecialRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        specialRequirements: prev.requirements.specialRequirements.filter((_, i) => i !== index)
      }
    }));
  };

  const updateSpecialRequirement = (index, value) => {
    setFormData(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        specialRequirements: prev.requirements.specialRequirements.map((req, i) =>
          i === index ? value : req
        )
      }
    }));
  };

  const handleStaffChange = (e) => {
    const selectedStaffId = e.target.value;

    if (selectedStaffId && !formData.staff.includes(selectedStaffId)) {
      setFormData(prev => ({
        ...prev,
        staff: [...prev.staff, selectedStaffId]
      }));
    }
  };

  const removeStaff = (staffId) => {
    setFormData(prev => ({
      ...prev,
      staff: prev.staff.filter(id => id !== staffId)
    }));
  };

  const validateStep = (step) => {
    const stepErrors = {};

    switch (step) {
      case 1:
        // Only validate business field when creating a new service
        if (!service && !formData.business) {
          stepErrors.business = 'Please select a business';
        }
        break;
      case 2:
        if (!formData.name.trim()) {
          stepErrors.name = 'Service name is required';
        }
        break;
      case 3:
        if (!formData.pricing.basePrice || formData.pricing.basePrice <= 0) {
          stepErrors['pricing.basePrice'] = 'Base price must be greater than 0';
        }
        break;
      case 4:
        if (!formData.duration.estimated || formData.duration.estimated < 15) {
          stepErrors['duration.estimated'] = 'Duration must be at least 15 minutes';
        }
        break;
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const validateForm = () => {
    const newErrors = {};

    // Only validate business field when creating a new service
    if (!service && !formData.business) {
      newErrors.business = 'Please select a business';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (!formData.pricing.basePrice || formData.pricing.basePrice <= 0) {
      newErrors['pricing.basePrice'] = 'Base price must be greater than 0';
    }

    if (!formData.duration.estimated || formData.duration.estimated < 15) {
      newErrors['duration.estimated'] = 'Duration must be at least 15 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      // Go to the first step with an error
      if (errors.business) setCurrentStep(1);
      else if (errors.name) setCurrentStep(2);
      else if (errors['pricing.basePrice']) setCurrentStep(3);
      else if (errors['duration.estimated']) setCurrentStep(4);
      return;
    }

    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        pricing: {
          ...formData.pricing,
          basePrice: parseFloat(formData.pricing.basePrice),
          variations: formData.pricing.variations.map(v => ({
            ...v,
            price: parseFloat(v.price)
          }))
        },
        duration: {
          ...formData.duration,
          estimated: parseInt(formData.duration.estimated),
          buffer: parseInt(formData.duration.buffer)
        },
        requirements: {
          ...formData.requirements,
          ageRestrictions: {
            minAge: formData.requirements.ageRestrictions.minAge ? 
              parseInt(formData.requirements.ageRestrictions.minAge) : undefined,
            maxAge: formData.requirements.ageRestrictions.maxAge ? 
              parseInt(formData.requirements.ageRestrictions.maxAge) : undefined
          }
        },
        staff: formData.staff,
        isActive: formData.isActive
      };

      // Only include business field when creating a new service
      if (!service) {
        submitData.business = formData.business;
      }

      if (service) {
        await dispatch(updateService({ serviceId: service._id, serviceData: submitData }));
      } else {
        await dispatch(createService(submitData));
      }

      onSave();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Select Business</h4>
              <p className="text-gray-600">Choose which business this service belongs to</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business *
              </label>
              <select
                name="business"
                value={formData.business}
                onChange={handleInputChange}
                disabled={businessesLoading || service}
                className={`w-full px-4 py-3 rounded-lg border ${
                  errors.business ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">
                  {businessesLoading ? 'Loading businesses...' : 'Choose a business'}
                </option>
                {businesses.map((business) => (
                  <option key={business._id} value={business._id}>
                    {business.profile?.name || business.name}
                  </option>
                ))}
              </select>
              {errors.business && (
                <p className="mt-2 text-sm text-red-600">{errors.business}</p>
              )}
              {service && (
                <p className="mt-2 text-sm text-gray-500">
                  Business cannot be changed when editing an existing service
                </p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Basic Information</h4>
              <p className="text-gray-600">Provide essential details about your service</p>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors`}
                  placeholder="Enter service name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors resize-none"
                  placeholder="Describe your service"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                >
                  <option value="grooming">Grooming</option>
                  <option value="veterinary">Veterinary</option>
                  <option value="boarding">Boarding</option>
                  <option value="training">Training</option>
                  <option value="daycare">Daycare</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Service is active
                </label>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Pricing Information</h4>
              <p className="text-gray-600">Set up pricing for your service</p>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Price *
                  </label>
                  <input
                    type="number"
                    name="pricing.basePrice"
                    value={formData.pricing.basePrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      errors['pricing.basePrice'] ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors`}
                    placeholder="0.00"
                  />
                  {errors['pricing.basePrice'] && (
                    <p className="mt-2 text-sm text-red-600">{errors['pricing.basePrice']}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    name="pricing.currency"
                    value={formData.pricing.currency}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                  >
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Type
                </label>
                <select
                  name="pricing.priceType"
                  value={formData.pricing.priceType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="variable">Variable Price</option>
                </select>
              </div>

              {formData.pricing.priceType === 'variable' && (
                <div className="bg-gray-50 p-5 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-medium text-gray-700">
                      Price Variations
                    </label>
                    <button
                      type="button"
                      onClick={addPriceVariation}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <PlusIcon className="h-5 w-5" />
                    </button>
                  </div>
                  {formData.pricing.variations.map((variation, index) => (
                    <div key={index} className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Variation name"
                        value={variation.name}
                        onChange={(e) => updatePriceVariation(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={variation.price}
                        onChange={(e) => updatePriceVariation(index, 'price', e.target.value)}
                        className="w-28 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      />
                      <button
                        type="button"
                        onClick={() => removePriceVariation(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <MinusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Duration Settings</h4>
              <p className="text-gray-600">How long does this service typically take?</p>
            </div>
            
            <div className="max-w-md mx-auto space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Duration (minutes) *
                </label>
                <input
                  type="number"
                  name="duration.estimated"
                  value={formData.duration.estimated}
                  onChange={handleInputChange}
                  min="15"
                  max="480"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    errors['duration.estimated'] ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  } focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors`}
                  placeholder="60"
                />
                {errors['duration.estimated'] && (
                  <p className="mt-2 text-sm text-red-600">{errors['duration.estimated']}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buffer Time (minutes)
                </label>
                <input
                  type="number"
                  name="duration.buffer"
                  value={formData.duration.buffer}
                  onChange={handleInputChange}
                  min="0"
                  max="60"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors"
                  placeholder="15"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Additional time between appointments for preparation
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Service Requirements</h4>
              <p className="text-gray-600">Specify any special requirements for this service</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-gray-50 p-5 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="checkbox"
                    id="vaccinationRequired"
                    name="requirements.vaccinationRequired"
                    checked={formData.requirements.vaccinationRequired}
                    onChange={handleInputChange}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="vaccinationRequired" className="text-sm font-medium text-gray-700">
                    Vaccination Required
                  </label>
                </div>

                {formData.requirements.vaccinationRequired && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        Required Vaccines
                      </label>
                      <button
                        type="button"
                        onClick={addRequiredVaccine}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                    {formData.requirements.requiredVaccines.map((vaccine, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Vaccine name"
                          value={vaccine}
                          onChange={(e) => updateRequiredVaccine(index, e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                        />
                        <button
                          type="button"
                          onClick={() => removeRequiredVaccine(index)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <MinusIcon className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Age Restrictions (months)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      name="requirements.ageRestrictions.minAge"
                      value={formData.requirements.ageRestrictions.minAge}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      placeholder="Min age"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="requirements.ageRestrictions.maxAge"
                      value={formData.requirements.ageRestrictions.maxAge}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                      placeholder="Max age"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    Special Requirements
                  </label>
                  <button
                    type="button"
                    onClick={addSpecialRequirement}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
                {formData.requirements.specialRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      placeholder="Special requirement"
                      value={requirement}
                      onChange={(e) => updateSpecialRequirement(index, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpecialRequirement(index)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <MinusIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Staff Assignment</h4>
              <p className="text-gray-600">Assign staff members who can provide this service</p>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Staff Members
                </label>
                <select
                  onChange={handleStaffChange}
                  value=""
                  disabled={staffLoading}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {staffLoading ? 'Loading staff...' : 'Select staff member'}
                  </option>
                  {staffMembers
                    .filter(staff => !formData.staff.includes(staff._id))
                    .map((staff) => (
                      <option key={staff._id} value={staff._id}>
                        {staff.profile.firstName} {staff.profile.lastName}
                      </option>
                    ))}
                </select>
              </div>

              {formData.staff.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Assigned Staff Members</p>
                  {formData.staff.map((staffId) => {
                    const staff = staffMembers.find(s => s._id === staffId);
                    return (
                      <div key={staffId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">
                            {staff ? `${staff.profile.firstName} ${staff.profile.lastName}` : 'Unknown Staff'}
                          </p>
                          {staff?.profile?.email && (
                            <p className="text-sm text-gray-500 mt-1">{staff.profile.email}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStaff(staffId)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {formData.staff.length === 0 && (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No staff members assigned yet</p>
                  <p className="text-sm text-gray-400 mt-1">Select staff members from the dropdown above</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
      <div className="relative top-10 mx-auto p-0 w-full max-w-4xl">
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                {service ? 'Edit Service' : 'Create New Service'}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Stepper */}
          <div className="bg-gray-50 px-8 py-6 border-b">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className="relative">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold transition-all duration-300 ${
                        currentStep === step.number
                          ? 'bg-blue-600 text-white shadow-lg scale-110'
                          : currentStep > step.number
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {currentStep > step.number ? (
                        <CheckIcon className="h-6 w-6" />
                      ) : (
                        <span>{step.icon}</span>
                      )}
                    </div>
                    <p className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium whitespace-nowrap ${
                      currentStep === step.number ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-full h-1 mx-3 transition-all duration-300 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-300'
                    }`} style={{ width: '80px' }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 min-h-[400px]">
            <form onSubmit={handleSubmit}>
              {renderStepContent()}
            </form>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 border-t">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-all ${
                  currentStep === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Previous
              </button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index + 1 === currentStep
                        ? 'w-8 bg-blue-600'
                        : index + 1 < currentStep
                        ? 'w-2 bg-green-500'
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ArrowRightIcon className="h-5 w-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading.create || loading.update}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(loading.create || loading.update) && (
                    <LoadingSpinner size="sm" className="mr-2" />
                  )}
                  {service ? 'Update Service' : 'Create Service'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceForm;