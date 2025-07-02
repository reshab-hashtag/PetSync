import { useDispatch, useSelector } from 'react-redux';
import {
  BuildingOfficeIcon,
  ClockIcon,
  CreditCardIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { createBusiness, updateBusiness } from '../../store/slices/businessSlice';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useEffect } from 'react';
import { fetchActiveCategories, selectActiveCategories, selectActiveCategoriesError, selectActiveCategoriesLoading } from '../../store/slices/businessCategorySlice';

const BusinessForm = ({ business = null, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  // Redux state
  const categories = useSelector(selectActiveCategories);
  const categoriesLoading = useSelector(selectActiveCategoriesLoading);
  const [errors, setErrors] = useState({});

  const isEdit = !!business;

  const [formData, setFormData] = useState({
    profile: {
      name: '',
      companyName: '', // New company name field
      description: '',
      email: '',
      phone: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'IND'
      }
    },
    services: [],
    schedule: {
      timezone: 'Asia/Kolkata',
      workingHours: {
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
      appointmentBookingWindow: 30,
      cancellationPolicy: {
        hoursRequired: 24,
        feePercentage: 0
      },
      autoReminders: {
        email: { enabled: true, hoursBefore: 24 },
        sms: { enabled: false, hoursBefore: 2 }
      },
      paymentMethods: {
        cash: true,
        card: true,
        online: true
      }
    },
    subscription: {
      plan: 'free'
    }
  });

  console.log(categories)

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 60,
    price: { amount: 0, currency: 'INR' },
    category: 'general'
  });


  // Load categories on component mount
  useEffect(() => {
    dispatch(fetchActiveCategories());
  }, []);


  useEffect(() => {
    if (isEdit && business) {
      setFormData({
        profile: {
          name: business.profile?.name || '',
          companyName: business.profile?.companyName || '', // New company name field
          description: business.profile?.description || '',
          email: business.profile?.email || '',
          phone: business.profile?.phone || '',
          website: business.profile?.website || '',
          address: {
            street: business.profile?.address?.street || '',
            city: business.profile?.address?.city || '',
            state: business.profile?.address?.state || '',
            zipCode: business.profile?.address?.zipCode || '',
            country: business.profile?.address?.country || 'IND'
          }
        },
        services: business.services || [],
        schedule: business.schedule || formData.schedule,
        settings: business.settings || formData.settings,
        subscription: business.subscription || formData.subscription
      });
    }
  }, [business, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const keys = name.split('.');

    setFormData(prev => {
      const updated = { ...prev };
      let current = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (name, checked) => {
    const keys = name.split('.');

    setFormData(prev => {
      const updated = { ...prev };
      let current = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = checked;
      return updated;
    });
  };

  const handleWorkingHoursChange = (day, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedule: {
        ...prev.schedule,
        workingHours: {
          ...prev.schedule.workingHours,
          [day]: {
            ...prev.schedule.workingHours[day],
            [field]: value
          }
        }
      }
    }));
  };

  const addService = () => {
    if (!newService.name.trim()) {
      toast.error('Service name is required');
      return;
    }

    setFormData(prev => ({
      ...prev,
      services: [...prev.services, { ...newService, id: Date.now() }]
    }));

    setNewService({
      name: '',
      description: '',
      duration: 60,
      price: { amount: 0, currency: 'INR' },
      category: 'general'
    });
  };

  const removeService = (index) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.profile.name?.trim()) {
        newErrors['profile.name'] = 'Business name is required';
      }
      if (!formData.profile.companyName?.trim()) {
        newErrors['profile.companyName'] = 'Company name is required';
      }
      if (!formData.profile.email?.trim()) {
        newErrors['profile.email'] = 'Business email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.profile.email)) {
        newErrors['profile.email'] = 'Please enter a valid email address';
      }
      if (!formData.profile.phone?.trim()) {
        newErrors['profile.phone'] = 'Phone number is required';
      }
      if (!formData.profile.address.city?.trim()) {
        newErrors['profile.address.city'] = 'City is required';
      }
      if (!formData.profile.address.state?.trim()) {
        newErrors['profile.address.state'] = 'State is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    } else {
      toast.error('Please fix the errors before proceeding');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Separate the final submission from form submission
  const handleFinalSubmit = async () => {
    // Validate all steps before final submission
    if (!validateStep(1)) {
      setCurrentStep(1);
      toast.error('Please complete all required fields in Basic Information');
      return;
    }

    setLoading(true);

    try {
      const businessData = {
        businessData: formData
      };

      if (isEdit) {
        await dispatch(updateBusiness({ id: business._id, data: businessData })).unwrap();
        toast.success('Business updated successfully!');
      } else {
        await dispatch(createBusiness(businessData)).unwrap();
        toast.success('Business created successfully!');
      }

      onSuccess?.();
    } catch (error) {
      toast.error(error.message || `Failed to ${isEdit ? 'update' : 'create'} business`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission to prevent unwanted submissions
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Prevent form submission, handle navigation instead
    if (!isEdit && currentStep < 4) {
      handleNext();
    } else {
      handleFinalSubmit();
    }
  };

  const steps = [
    { id: 1, name: 'Basic Information', icon: BuildingOfficeIcon },
    { id: 2, name: 'Services', icon: PlusIcon },
    { id: 3, name: 'Schedule', icon: ClockIcon },
    { id: 4, name: 'Settings', icon: CreditCardIcon }
  ];

  const renderStepIndicator = () => (
    <div className="mb-8">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between w-full">
          {steps.map((step, stepIdx) => (
            <li key={step.id} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                {/* Step Number/Icon Circle */}
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${step.id < currentStep
                    ? 'bg-teal-500 border-teal-500'
                    : step.id === currentStep
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-blue-100 border-blue-200'
                    }`}
                >
                  {step.id < currentStep ? (
                    <CheckBadgeIcon className="h-5 w-5 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-semibold ${step.id === currentStep
                        ? 'text-white'
                        : 'text-blue-400'
                        }`}
                    >
                      {step.id}
                    </span>
                  )}
                </div>

                {/* Step Info */}
                <div className="mt-3 text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                    STEP {step.id}
                  </div>
                  <div
                    className={`text-sm font-medium mt-1 ${step.id <= currentStep ? 'text-gray-900' : 'text-gray-400'
                      }`}
                  >
                    {step.name}
                  </div>
                  <div
                    className={`text-xs mt-1 ${step.id < currentStep
                      ? 'text-teal-600'
                      : step.id === currentStep
                        ? 'text-blue-600'
                        : 'text-gray-400'
                      }`}
                  >
                    {step.id < currentStep
                      ? 'Completed'
                      : step.id === currentStep
                        ? 'In Progress'
                        : 'Pending'}
                  </div>
                </div>
              </div>

              {/* Connecting Line */}
              {stepIdx !== steps.length - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`h-0.5 w-full ${step.id < currentStep ? 'bg-teal-500' : 'bg-blue-200'
                      }`}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );

  const renderBasicInformation = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Name *
          </label>
          <input
            type="text"
            name="profile.name"
            value={formData.profile.name}
            onChange={handleInputChange}
            className={`input-field ${errors['profile.name'] ? 'border-red-300' : ''}`}
            placeholder="Enter business name"
          />
          {errors['profile.name'] && (
            <p className="text-red-500 text-sm mt-1">{errors['profile.name']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Email *
          </label>
          <input
            type="email"
            name="profile.email"
            value={formData.profile.email}
            onChange={handleInputChange}
            className={`input-field ${errors['profile.email'] ? 'border-red-300' : ''}`}
            placeholder="business@example.com"
          />
          {errors['profile.email'] && (
            <p className="text-red-500 text-sm mt-1">{errors['profile.email']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="profile.phone"
            value={formData.profile.phone}
            onChange={handleInputChange}
            className={`input-field ${errors['profile.phone'] ? 'border-red-300' : ''}`}
            placeholder="+91 9876543210"
          />
          {errors['profile.phone'] && (
            <p className="text-red-500 text-sm mt-1">{errors['profile.phone']}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website (Optional)
          </label>
          <input
            type="url"
            name="profile.website"
            value={formData.profile.website}
            onChange={handleInputChange}
            className="input-field"
            placeholder="https://www.yourbusiness.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Description
        </label>
        <textarea
          name="profile.description"
          value={formData.profile.description}
          onChange={handleInputChange}
          rows={3}
          className="input-field"
          placeholder="Describe your business..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Name *
        </label>
        <input
          type="text"
          name="profile.companyName"
          value={formData.profile.companyName}
          onChange={handleInputChange}
          className={`input-field ${errors['profile.companyName'] ? 'border-red-300' : ''}`}
          placeholder="Enter company Name"
        />
        {errors['profile.companyName'] && (
          <p className="text-red-500 text-sm mt-1">{errors['profile.companyName']}</p>
        )}
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Address</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              name="profile.address.street"
              value={formData.profile.address.street}
              onChange={handleInputChange}
              className="input-field"
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="profile.address.city"
              value={formData.profile.address.city}
              onChange={handleInputChange}
              className={`input-field ${errors['profile.address.city'] ? 'border-red-300' : ''}`}
              placeholder="City"
            />
            {errors['profile.address.city'] && (
              <p className="text-red-500 text-sm mt-1">{errors['profile.address.city']}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              name="profile.address.state"
              value={formData.profile.address.state}
              onChange={handleInputChange}
              className={`input-field ${errors['profile.address.state'] ? 'border-red-300' : ''}`}
              placeholder="State"
            />
            {errors['profile.address.state'] && (
              <p className="text-red-500 text-sm mt-1">{errors['profile.address.state']}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code
            </label>
            <input
              type="text"
              name="profile.address.zipCode"
              value={formData.profile.address.zipCode}
              onChange={handleInputChange}
              className="input-field"
              placeholder="123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              name="profile.address.country"
              value={formData.profile.address.country}
              onChange={handleInputChange}
              className="input-field"
            >
              <option value="IND">India</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Business Services</h3>
        <span className="text-sm text-gray-500">
          {formData.services.length} service{formData.services.length !== 1 ? 's' : ''} added
        </span>
      </div>

      {/* Add New Service */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-md font-medium text-gray-900 mb-4">Add New Service</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Name
            </label>
            <input
              type="text"
              value={newService.name}
              onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
              className="input-field"
              placeholder="e.g., Dog Grooming"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={newService.duration}
              onChange={(e) => setNewService(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
              className="input-field"
              min="15"
              max="480"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price (₹)
            </label>
            <input
              type="number"
              value={newService.price.amount}
              onChange={(e) => setNewService(prev => ({
                ...prev,
                price: { ...prev.price, amount: parseFloat(e.target.value) || 0 }
              }))}
              className="input-field"
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Category
            </label>
            {categoriesLoading ? (
              <div className="input-field flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Loading categories...</span>
              </div>
            ) : (
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Description
          </label>
          <textarea
            value={newService.description}
            onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="input-field"
            placeholder="Brief description of the service..."
          />
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={addService}
            className="btn-secondary inline-flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Service
          </button>
        </div>
      </div>

      {/* Services List */}
      {formData.services.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Current Services</h4>
          <div className="space-y-3">
            {formData.services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h5 className="font-medium text-gray-900">{service.name}</h5>
                      <p className="text-sm text-gray-500">{service.description}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded mr-2">
                        {service.duration} min
                      </span>
                      <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                        ₹{service.price.amount}
                      </span>
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {service.category}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="text-red-600 hover:text-red-900"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Business Schedule</h3>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Timezone
        </label>
        <select
          name="schedule.timezone"
          value={formData.schedule.timezone}
          onChange={handleInputChange}
          className="input-field max-w-md"
        >
          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
          <option value="America/New_York">America/New_York (EST)</option>
          <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
          <option value="Europe/London">Europe/London (GMT)</option>
        </select>
      </div>

      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Working Hours</h4>
        <div className="space-y-4">
          {Object.entries(formData.schedule.workingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center space-x-4">
              <div className="w-24">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {day}
                </span>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={hours.isOpen}
                  onChange={(e) => handleWorkingHoursChange(day, 'isOpen', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">Open</span>
              </label>
              {hours.isOpen && (
                <>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) => handleWorkingHoursChange(day, 'open', e.target.value)}
                    className="input-field w-32"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) => handleWorkingHoursChange(day, 'close', e.target.value)}
                    className="input-field w-32"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Business Settings</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Appointment Booking Window (days)
          </label>
          <input
            type="number"
            name="settings.appointmentBookingWindow"
            value={formData.settings.appointmentBookingWindow}
            onChange={handleInputChange}
            className="input-field"
            min="1"
            max="365"
          />
          <p className="text-xs text-gray-500 mt-1">
            How far in advance clients can book appointments
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cancellation Hours Required
          </label>
          <input
            type="number"
            name="settings.cancellationPolicy.hoursRequired"
            value={formData.settings.cancellationPolicy.hoursRequired}
            onChange={handleInputChange}
            className="input-field"
            min="1"
            max="168"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum hours before appointment for free cancellation
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Auto Reminders</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">Email Reminders</label>
              <p className="text-xs text-gray-500">Send email reminders to clients</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings.autoReminders.email.enabled}
              onChange={(e) => handleCheckboxChange('settings.autoReminders.email.enabled', e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">SMS Reminders</label>
              <p className="text-xs text-gray-500">Send SMS reminders to clients</p>
            </div>
            <input
              type="checkbox"
              checked={formData.settings.autoReminders.sms.enabled}
              onChange={(e) => handleCheckboxChange('settings.autoReminders.sms.enabled', e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Payment Methods</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.settings.paymentMethods.cash}
              onChange={(e) => handleCheckboxChange('settings.paymentMethods.cash', e.target.checked)}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <label className="ml-2 text-sm text-gray-900">Online</label>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium text-gray-900 mb-4">Subscription Plan</h4>
        <select
          name="subscription.plan"
          value={formData.subscription.plan}
          onChange={handleInputChange}
          className="input-field max-w-md"
        >
          <option value="free">Free Plan</option>
          <option value="basic">Basic Plan - ₹999/month</option>
          <option value="premium">Premium Plan - ₹1999/month</option>
        </select>
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderServices();
      case 3:
        return renderSchedule();
      case 4:
        return renderSettings();
      default:
        return renderBasicInformation();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {!isEdit && renderStepIndicator()}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        {renderCurrentStep()}

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            {!isEdit && currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="btn-secondary"
                disabled={loading}
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {!isEdit && currentStep < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary"
                disabled={loading}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="btn-primary inline-flex items-center"
                disabled={loading}
              >
                {loading && <LoadingSpinner size="sm" className="mr-2" />}
                {isEdit ? 'Update Business' : 'Create Business'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default BusinessForm;