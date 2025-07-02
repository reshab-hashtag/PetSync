import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { createStaffMember, updateStaffMember } from '../../store/slices/staffSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import toast, { CheckmarkIcon } from 'react-hot-toast';
import { ArrowLeftIcon, ArrowPathRoundedSquareIcon, ArrowRightIcon, CalendarIcon, PhoneIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';

const StaffForm = ({ staff = null, isEdit = false, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'staff',
    specializations: [],
    permissions: {
      appointments: { view: true, create: false, edit: false, delete: false },
      clients: { view: true, create: false, edit: false, delete: false },
      pets: { view: true, create: false, edit: false, delete: false },
      billing: { view: false, create: false, edit: false, delete: false },
      reports: { view: false }
    },
    schedule: {
      monday: { enabled: true, start: '09:00', end: '17:00' },
      tuesday: { enabled: true, start: '09:00', end: '17:00' },
      wednesday: { enabled: true, start: '09:00', end: '17:00' },
      thursday: { enabled: true, start: '09:00', end: '17:00' },
      friday: { enabled: true, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' }
    },
    emergencyContact: { name: '', relationship: '', phone: '' }
  });

  const [errors, setErrors] = useState({});

  const steps = [
    { id: 1, name: 'Basic Info', icon: UserIcon },
    { id: 2, name: 'Specializations', icon: ArrowPathRoundedSquareIcon },
    { id: 3, name: 'Permissions', icon: ShieldCheckIcon },
    { id: 4, name: 'Schedule', icon: CalendarIcon },
    { id: 5, name: 'Emergency Contact', icon: PhoneIcon }
  ];

  useEffect(() => {
    if (isEdit && staff) {
      setFormData({
        firstName: staff.profile.firstName || '',
        lastName: staff.profile.lastName || '',
        email: staff.profile.email || '',
        phone: staff.profile.phone || '',
        role: staff.role || 'staff',
        specializations: staff.specializations || [],
        permissions: staff.permissions || formData.permissions,
        schedule: staff.schedule || formData.schedule,
        emergencyContact: staff.emergencyContact || formData.emergencyContact
      });
    }
  }, [isEdit, staff]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSpecializationChange = (specialization) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(specialization)
        ? prev.specializations.filter(s => s !== specialization)
        : [...prev.specializations, specialization]
    }));
  };

  const handlePermissionChange = (module, permission, value) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: { ...prev.permissions[module], [permission]: value }
      }
    }));
  };

  const handleScheduleChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        [day]: { ...prev.schedule[day], [field]: value }
      }
    }));
  };

  const handleEmergencyContactChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: { ...prev.emergencyContact, [field]: value }
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      if (formData.phone && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone)) {
        newErrors.phone = 'Phone number is invalid';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      let result;
      if (isEdit) {
        const updateData = {
          'profile.firstName': formData.firstName,
          'profile.lastName': formData.lastName,
          'profile.phone': formData.phone,
          specializations: formData.specializations,
          permissions: formData.permissions,
          schedule: formData.schedule,
          emergencyContact: formData.emergencyContact
        };
        result = await dispatch(updateStaffMember({ id: staff._id, data: updateData })).unwrap();
        toast.success('Staff member updated successfully');
        onSuccess();
      } else {
        result = await dispatch(createStaffMember(formData)).unwrap();
        if (result.data?.tempPassword) {
          setTempPassword(result.data.tempPassword);
          setShowTempPassword(true);
          toast.success('Staff member created successfully');
          return;
        }
        toast.success('Staff member created successfully');
        onSuccess();
      }
    } catch (error) {
      toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} staff member`);
    } finally {
      setLoading(false);
    }
  };

  const availableSpecializations = [
    'Dog Grooming', 'Cat Grooming', 'Nail Trimming', 'Teeth Cleaning',
    'Flea Treatment', 'Behavioral Training', 'Pet Sitting', 'Dog Walking',
    'Veterinary Care', 'Emergency Care'
  ];

  const permissionModules = [
    { key: 'appointments', label: 'Appointments' },
    { key: 'clients', label: 'Clients' },
    { key: 'pets', label: 'Pets' },
    { key: 'billing', label: 'Billing' },
    { key: 'reports', label: 'Reports' }
  ];

  const permissionTypes = [
    { key: 'view', label: 'View' },
    { key: 'create', label: 'Create' },
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete' }
  ];

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' }
  ];

  if (showTempPassword) {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Staff Member Created Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>A temporary password has been generated for the new staff member:</p>
                <div className="mt-2 p-3 bg-white border border-green-300 rounded font-mono text-lg">
                  {tempPassword}
                </div>
                <p className="mt-2">
                  Please share this password securely with the staff member. They will be required to change it on first login.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onSuccess} className="btn-primary">
            Done
          </button>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className={`input-field mt-1 ${errors.firstName ? 'border-red-300' : ''}`}
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className={`input-field mt-1 ${errors.lastName ? 'border-red-300' : ''}`}
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className={`input-field mt-1 ${errors.email ? 'border-red-300' : ''}`}
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading || isEdit}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                {isEdit && <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className={`input-field mt-1 ${errors.phone ? 'border-red-300' : ''}`}
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                className="input-field mt-1"
                value={formData.role}
                onChange={handleChange}
                disabled={loading || isEdit}
              >
                <option value="staff">Staff</option>
                <option value="business_admin">Business Admin</option>
              </select>
              {isEdit && <p className="mt-1 text-sm text-gray-500">Role cannot be changed</p>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Specializations</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableSpecializations.map((specialization) => (
                <label key={specialization} className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={formData.specializations.includes(specialization)}
                    onChange={() => handleSpecializationChange(specialization)}
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-700">{specialization}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Module
                    </th>
                    {permissionTypes.map((type) => (
                      <th key={type.key} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {type.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {permissionModules.map((module) => (
                    <tr key={module.key}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {module.label}
                      </td>
                      {permissionTypes.map((type) => (
                        <td key={type.key} className="px-4 py-4 whitespace-nowrap text-center">
                          {formData.permissions[module.key] && typeof formData.permissions[module.key][type.key] !== 'undefined' ? (
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                              checked={formData.permissions[module.key][type.key]}
                              onChange={(e) => handlePermissionChange(module.key, type.key, e.target.checked)}
                              disabled={loading}
                            />
                          ) : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Work Schedule</h3>
            <div className="space-y-3">
              {daysOfWeek.map((day) => (
                <div key={day.key} className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`${day.key}-enabled`}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={formData.schedule[day.key]?.enabled || false}
                      onChange={(e) => handleScheduleChange(day.key, 'enabled', e.target.checked)}
                      disabled={loading}
                    />
                    <label htmlFor={`${day.key}-enabled`} className="ml-2 text-sm font-medium text-gray-700 w-20">
                      {day.label}
                    </label>
                  </div>
                  {formData.schedule[day.key]?.enabled && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        className="input-field w-32"
                        value={formData.schedule[day.key]?.start || '09:00'}
                        onChange={(e) => handleScheduleChange(day.key, 'start', e.target.value)}
                        disabled={loading}
                      />
                      <span className="text-gray-500">to</span>
                      <input
                        type="time"
                        className="input-field w-32"
                        value={formData.schedule[day.key]?.end || '17:00'}
                        onChange={(e) => handleScheduleChange(day.key, 'end', e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="emergencyName" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="emergencyName"
                  className="input-field mt-1"
                  value={formData.emergencyContact.name}
                  onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="emergencyRelationship" className="block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <input
                  type="text"
                  id="emergencyRelationship"
                  className="input-field mt-1"
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="tel"
                  id="emergencyPhone"
                  className="input-field mt-1"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {/* Stepper */}
      <div className="mb-8">
        <ol className="flex items-center justify-between w-full">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                    step.id < currentStep
                      ? 'bg-teal-500 border-teal-500'
                      : step.id === currentStep
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-blue-100 border-blue-200'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckmarkIcon className="h-5 w-5 text-white" />
                  ) : (
                    <step.icon
                      className={`h-5 w-5 ${
                        step.id === currentStep ? 'text-white' : 'text-blue-400'
                      }`}
                    />
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
                      step.id < currentStep ? 'bg-teal-500' : 'bg-blue-200'
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
                isEdit ? 'Update Staff Member' : 'Create Staff Member'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffForm;