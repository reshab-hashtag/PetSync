// AddPetModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, HeartIcon, UserIcon, BuildingOfficeIcon, CheckIcon, ArrowLeftIcon, ArrowRightIcon, ShieldCheckIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { createPet, updatePet } from '../../store/slices/petSlice';
import { fetchBusinesses } from '../../store/slices/businessSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const AddPetModal = ({ isOpen, onClose, onSuccess, clients, editPet = null }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading } = useSelector((state) => state.pets);
  const { businesses, loading: businessesLoading } = useSelector((state) => state.business);

  // Check if current user is a client
  const isClientUser = user?.role === 'client';

  // Stepper state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  // Define steps based on user role
  const getSteps = () => {
    if (isClientUser) {
      return [
        { 
          id: 'business', 
          title: 'Select Business', 
          icon: BuildingOfficeIcon,
          description: 'Choose where to register your pet'
        },
        { 
          id: 'owner', 
          title: 'Owner Info', 
          icon: UserIcon,
          description: 'Verify your information'
        },
        { 
          id: 'pet', 
          title: 'Pet Profile', 
          icon: HeartIcon,
          description: 'Pet details and information'
        },
        { 
          id: 'medical', 
          title: 'Medical History', 
          icon: ShieldCheckIcon,
          description: 'Health and medical information'
        },
        { 
          id: 'emergency', 
          title: 'Emergency Contact', 
          icon: PhoneIcon,
          description: 'Emergency contact details'
        }
      ];
    } else {
      return [
        { 
          id: 'owner', 
          title: 'Owner Selection', 
          icon: UserIcon,
          description: 'Choose the pet owner'
        },
        { 
          id: 'pet', 
          title: 'Pet Profile', 
          icon: HeartIcon,
          description: 'Pet details and information'
        },
        { 
          id: 'medical', 
          title: 'Medical History', 
          icon: ShieldCheckIcon,
          description: 'Health and medical information'
        },
        { 
          id: 'emergency', 
          title: 'Emergency Contact', 
          icon: PhoneIcon,
          description: 'Emergency contact details'
        }
      ];
    }
  };

  const steps = getSteps();

  const [formData, setFormData] = useState({
    ownerId: '',
    businessId: '',
    profile: {
      name: '',
      species: 'dog',
      breed: '',
      gender: 'male',
      dateOfBirth: '',
      weight: '',
      color: '',
      microchipId: '',
      notes: ''
    },
    medicalHistory: {
      allergies: [],
      medications: [],
      conditions: [],
      vaccinations: []
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  const [allergies, setAllergies] = useState('');
  const [medications, setMedications] = useState('');
  const [conditions, setConditions] = useState('');

  // Auto-fill client details when modal opens for client users
  useEffect(() => {
    if (isOpen) {
      // Reset stepper
      setCurrentStep(0);
      setCompletedSteps(new Set());
      
      // Fetch businesses for client selection
      dispatch(fetchBusinesses({ page: 1, limit: 100 }));
      
      if (isClientUser && user) {
        setFormData(prev => ({
          ...prev,
          ownerId: user._id || user.id
        }));
        // Mark owner step as completed for clients
        setCompletedSteps(prev => new Set([...prev, 'owner']));
      }
    }
  }, [isOpen, isClientUser, user, dispatch]);

  useEffect(() => {
    if (editPet) {
      const ownerId = editPet.owner._id || editPet.owner.id || editPet.owner;
      
      setFormData({
        ownerId: isClientUser ? (user._id || user.id) : ownerId,
        businessId: editPet.business || '',
        profile: {
          name: editPet.profile.name || '',
          species: editPet.profile.species || 'dog',
          breed: editPet.profile.breed || '',
          gender: editPet.profile.gender || 'male',
          dateOfBirth: editPet.profile.dateOfBirth ? new Date(editPet.profile.dateOfBirth).toISOString().split('T')[0] : '',
          weight: editPet.profile.weight || '',
          color: editPet.profile.color || '',
          microchipId: editPet.profile.microchipId || '',
          notes: editPet.profile.notes || ''
        },
        medicalHistory: {
          allergies: editPet.medicalHistory?.allergies || [],
          medications: editPet.medicalHistory?.medications || [],
          conditions: editPet.medicalHistory?.conditions || [],
          vaccinations: editPet.medicalHistory?.vaccinations || []
        },
        emergencyContact: {
          name: editPet.emergencyContact?.name || '',
          phone: editPet.emergencyContact?.phone || '',
          relationship: editPet.emergencyContact?.relationship || ''
        }
      });
      
      setAllergies(editPet.medicalHistory?.allergies?.join(', ') || '');
      setMedications(editPet.medicalHistory?.medications?.join(', ') || '');
      setConditions(editPet.medicalHistory?.conditions?.join(', ') || '');
      
      // Mark steps as completed based on available data
      const completed = new Set();
      if (isClientUser) {
        completed.add('owner');
        if (editPet.business) completed.add('business');
      } else {
        if (ownerId) completed.add('owner');
      }
      if (editPet.profile.name && editPet.profile.breed) completed.add('pet');
      if (editPet.medicalHistory) completed.add('medical');
      if (editPet.emergencyContact?.name) completed.add('emergency');
      
      setCompletedSteps(completed);
    }
  }, [editPet, isClientUser, user]);

  const resetForm = () => {
    setFormData({
      ownerId: isClientUser ? (user._id || user.id) : '',
      businessId: '',
      profile: {
        name: '',
        species: 'dog',
        breed: '',
        gender: 'male',
        dateOfBirth: '',
        weight: '',
        color: '',
        microchipId: '',
        notes: ''
      },
      medicalHistory: {
        allergies: [],
        medications: [],
        conditions: [],
        vaccinations: []
      },
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setAllergies('');
    setMedications('');
    setConditions('');
    setCurrentStep(0);
    setCompletedSteps(new Set(isClientUser ? ['owner'] : []));
  };

  const handleProfileChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
  };

  // Validation for each step
  const validateStep = (stepId) => {
    switch (stepId) {
      case 'business':
        return formData.businessId !== '';
      case 'owner':
        return formData.ownerId !== '';
      case 'pet':
        return formData.profile.name !== '' && formData.profile.breed !== '';
      case 'medical':
        return true; // Optional step
      case 'emergency':
        return true; // Optional step
      default:
        return true;
    }
  };

  // Handle next step
  const handleNext = () => {
    const currentStepData = steps[currentStep];
    
    if (validateStep(currentStepData.id)) {
      setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error('Please fill in all required fields before proceeding');
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle step click
  const handleStepClick = (stepIndex) => {
    // Allow clicking on previous steps or next step if current is valid
    if (stepIndex <= currentStep || completedSteps.has(steps[stepIndex].id)) {
      setCurrentStep(stepIndex);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all required steps
    const requiredSteps = isClientUser 
      ? ['business', 'owner', 'pet'] 
      : ['owner', 'pet'];
    
    const invalidSteps = requiredSteps.filter(stepId => !validateStep(stepId));
    
    if (invalidSteps.length > 0) {
      toast.error('Please complete all required steps');
      return;
    }

    // Process medical history arrays
    const petData = {
      ...formData,
      businessId: isClientUser 
        ? formData.businessId 
        : (user?.business?.[0]?._id || user?.userData?.business?.[0]?._id),
      medicalHistory: {
        ...formData.medicalHistory,
        allergies: allergies.split(',').map(item => item.trim()).filter(item => item),
        medications: medications.split(',').map(item => item.trim()).filter(item => item),
        conditions: conditions.split(',').map(item => item.trim()).filter(item => item)
      }
    };

    console.log('Pet data to be sent:', petData);

    try {
      if (editPet) {
        await dispatch(updatePet({ id: editPet._id, petData })).unwrap();
        toast.success('Pet updated successfully!');
      } else {
        await dispatch(createPet(petData)).unwrap();
        toast.success('Pet added successfully!');
      }
      onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error saving pet:', error);
      toast.error(error.message || `Failed to ${editPet ? 'update' : 'add'} pet`);
    }
  };

  const handleClose = () => {
    if (!editPet) {
      resetForm();
    }
    onClose();
  };

  // Render step content
  const renderStepContent = () => {
    const currentStepData = steps[currentStep];
    
    switch (currentStepData.id) {
      case 'business':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BuildingOfficeIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select Business</h3>
              <p className="text-sm text-gray-600">Choose where you want to register your pet for services</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose Business <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.businessId}
                onChange={(e) => setFormData(prev => ({ ...prev, businessId: e.target.value }))}
                className="input-field"
                required
                disabled={businessesLoading}
              >
                <option value="">Select a business...</option>
                {businesses?.map((business) => (
                  <option key={business._id} value={business._id}>
                    {business.profile?.name} - {business.profile?.address?.city || 'No location'}
                  </option>
                ))}
              </select>
              {businessesLoading && (
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Loading businesses...
                </p>
              )}
            </div>
            
            {/* Show selected business details */}
            {formData.businessId && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                {(() => {
                  const selectedBusiness = businesses.find(b => b._id === formData.businessId);
                  return selectedBusiness ? (
                    <div className="flex items-start space-x-3">
                      <BuildingOfficeIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900">{selectedBusiness.profile?.name}</h4>
                        {selectedBusiness.profile?.description && (
                          <p className="text-sm text-blue-700 mt-1">{selectedBusiness.profile.description}</p>
                        )}
                        <div className="flex flex-wrap gap-4 mt-2 text-sm text-blue-600">
                          {selectedBusiness.profile?.address && (
                            <span className="flex items-center">
                              📍 {selectedBusiness.profile.address.city}
                            </span>
                          )}
                          {selectedBusiness.profile?.phone && (
                            <span className="flex items-center">
                              📞 {selectedBusiness.profile.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        );
        
      case 'owner':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <UserIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isClientUser ? 'Owner Information' : 'Select Owner'}
              </h3>
              <p className="text-sm text-gray-600">
                {isClientUser ? 'Your information as the pet owner' : 'Choose the pet owner from clients'}
              </p>
            </div>
            
            {isClientUser ? (
              <div className="bg-gray-50 p-4 rounded-md border">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.profile?.firstName || user.firstName} {user.profile?.lastName || user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user.profile?.email || user.email}</p>
                    {(user.profile?.phone || user.phone) && (
                      <p className="text-sm text-gray-500">📞 {user.profile?.phone || user.phone}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  ✓ You are automatically set as the owner of this pet
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Owner <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.ownerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerId: e.target.value }))}
                  className="input-field"
                  required
                >
                  <option value="">Choose an owner...</option>
                  {clients.map((client) => (
                    <option key={client._id || client.id} value={client._id || client.id}>
                      {client.profile?.firstName || client.firstName} {client.profile?.lastName || client.lastName} - {client.profile?.email || client.email}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        );
        
      case 'pet':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <HeartIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Pet Profile</h3>
              <p className="text-sm text-gray-600">Tell us about your pet</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pet Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Buddy, Whiskers"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Species <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.profile.species}
                  onChange={(e) => handleProfileChange('species', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                  <option value="bird">Bird</option>
                  <option value="rabbit">Rabbit</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Breed <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.profile.breed}
                  onChange={(e) => handleProfileChange('breed', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Golden Retriever, Persian"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.profile.gender}
                  onChange={(e) => handleProfileChange('gender', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.profile.dateOfBirth}
                  onChange={(e) => handleProfileChange('dateOfBirth', e.target.value)}
                  className="input-field"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (lbs)
                </label>
                <input
                  type="number"
                  value={formData.profile.weight}
                  onChange={(e) => handleProfileChange('weight', parseFloat(e.target.value) || '')}
                  className="input-field"
                  placeholder="0.0"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={formData.profile.color}
                  onChange={(e) => handleProfileChange('color', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Golden, Black, White"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Microchip ID
                </label>
                <input
                  type="text"
                  value={formData.profile.microchipId}
                  onChange={(e) => handleProfileChange('microchipId', e.target.value)}
                  className="input-field"
                  placeholder="e.g., MC123456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.profile.notes}
                onChange={(e) => handleProfileChange('notes', e.target.value)}
                className="input-field"
                rows="3"
                placeholder="Any special notes about the pet..."
              />
            </div>
          </div>
        );
        
      case 'medical':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <ShieldCheckIcon className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Medical History</h3>
              <p className="text-sm text-gray-600">Health information and medical records (optional)</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allergies
                </label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="input-field"
                  placeholder="Separate multiple allergies with commas (e.g., chicken, wheat, grass)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Medications
                </label>
                <input
                  type="text"
                  value={medications}
                  onChange={(e) => setMedications(e.target.value)}
                  className="input-field"
                  placeholder="Separate multiple medications with commas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medical Conditions
                </label>
                <input
                  type="text"
                  value={conditions}
                  onChange={(e) => setConditions(e.target.value)}
                  className="input-field"
                  placeholder="Separate multiple conditions with commas"
                />
              </div>
            </div>
          </div>
        );
        
      case 'emergency':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <PhoneIcon className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Emergency Contact</h3>
              <p className="text-sm text-gray-600">Contact information for emergencies (optional)</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                  className="input-field"
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                  className="input-field"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                  className="input-field"
                  placeholder="e.g., Family member, Friend"
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editPet ? 'Edit Pet' : 'Add New Pet'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = completedSteps.has(step.id);
              const isClickable = index <= currentStep || isCompleted;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div 
                    className={`flex flex-col items-center justify-center cursor-pointer ${isClickable ? 'hover:opacity-80' : 'cursor-not-allowed'}`}
                    onClick={() => isClickable && handleStepClick(index)}
                  >
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all
                      ${isActive ? 'bg-blue-600 text-white' : 
                        isCompleted ? 'bg-green-600 text-white' : 
                        'bg-gray-200 text-gray-600'}
                    `}>
                      {isCompleted ? (
                        <CheckIcon className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-400">{step.description}</p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`mx-4 h-0.5 w-12 ${isCompleted ? 'bg-green-600' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t mt-6">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentStep === 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </button>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              
              {currentStep === steps.length - 1 ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center"
                >
                  {isLoading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {editPet ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    <>
                      <HeartIcon className="h-4 w-4 mr-2" />
                      {editPet ? 'Update Pet' : 'Add Pet'}
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={businessesLoading || !validateStep(steps[currentStep].id)}
                  className="btn-primary flex items-center"
                >
                  Next
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPetModal;