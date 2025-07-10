// AddPetModal.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, HeartIcon, UserIcon } from '@heroicons/react/24/outline';
import { createPet, updatePet } from '../../store/slices/petSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const AddPetModal = ({ isOpen, onClose, onSuccess, clients, editPet = null }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isLoading } = useSelector((state) => state.pets);

  const [formData, setFormData] = useState({
    ownerId: '',
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

  useEffect(() => {
    if (editPet) {
      setFormData({
        ownerId: editPet.owner._id || editPet.owner.id,
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
    }
  }, [editPet]);

  const resetForm = () => {
    setFormData({
      ownerId: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.ownerId) {
      toast.error('Please select an owner');
      return;
    }

    if (!formData.profile.name || !formData.profile.breed) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Process medical history arrays
    const petData = {
      ...formData,
      businessId: user?.business?.[0]?._id,
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
      resetForm();
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Owner Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <UserIcon className="h-5 w-5 mr-2" />
              Owner Information
            </h3>
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
          </div>

          {/* Pet Profile */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <HeartIcon className="h-5 w-5 mr-2" />
              Pet Profile
            </h3>
            
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

            <div className="mt-6">
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

          {/* Medical History */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Medical History</h3>
            
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

          {/* Emergency Contact */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
            
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

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              Cancel
            </button>
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPetModal;