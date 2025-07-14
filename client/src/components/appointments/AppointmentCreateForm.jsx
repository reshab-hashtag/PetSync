import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { XMarkIcon, CalendarIcon, ClockIcon, UserIcon, PhoneIcon, PlusIcon } from '@heroicons/react/24/outline';
import { createAppointment, fetchAppointments } from '../../store/slices/appointmentSlice';
import { fetchBusinesses } from '../../store/slices/businessSlice';
import { getClients } from '../../store/slices/clientSlice';
import { fetchServices } from '../../store/slices/serviceSlice'; // Add this import
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const AppointmentCreateForm = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { clients } = useSelector((state) => state.client);
  const { businesses } = useSelector(state => state.business);
  const { services } = useSelector((state) => state.services); // Add services from state
  const { isLoading } = useSelector((state) => state.appointments);

  // Check if the current user is a client
  const isClientUser = user?.role === 'client';

  // Keep the flat form structure for easier UI handling
  const [formData, setFormData] = useState({
    businessId: isClientUser ? '' : (user?.business?.[0]?._id || ''),
    clientId: '',
    petId: '',
    serviceId: '', // Changed from serviceName to serviceId
    duration: 60,
    price: 0,
    date: '',
    startTime: '',
    notes: '',
    specialRequests: ''
  });

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedService, setSelectedService] = useState(null); // Add selected service state
  const [availablePets, setAvailablePets] = useState([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    serviceName: '',
    phone: '',
    petName: '',
    petSpecies: 'dog',
    petBreed: ''
  });

  useEffect(() => {
    if (isOpen) {
      // Only fetch clients if the user is not a client

      if (isClientUser) {
        const ownerId = typeof user.profile.createdBy === 'object'
          ? user.profile.createdBy._id
          : user.profile.createdBy;
        dispatch(fetchBusinesses());
      }
      if (!isClientUser) {
        dispatch(getClients());
      }
      // Fetch available services
      dispatch(fetchServices({ businessId: formData.businessId }));
    }
  }, [isOpen, dispatch, isClientUser, formData.businessId]);

  // Auto-select client if the current user is a client
  useEffect(() => {
    if (isClientUser && user) {
      // Set the client ID to the current user's ID
      const clientId = user._id || user.id;
      setFormData(prev => ({
        ...prev,
        clientId: clientId
      }));

      // Set selected client data
      setSelectedClient(user);

      // If user has pets, set available pets
      if (user.pets) {
        setAvailablePets(user.pets);
      }
    }
  }, [isClientUser, user]);

  useEffect(() => {
    // Only update available pets for non-client users
    if (!isClientUser && selectedClient && selectedClient.pets) {
      setAvailablePets(selectedClient.pets);
    } else if (!isClientUser) {
      setAvailablePets([]);
    }
  }, [selectedClient, isClientUser]);

  // Helper function to check if a field is empty
  const isFieldEmpty = (value) => {
    return !value || value.toString().trim() === '';
  };

  // Helper function to create full datetime from date and time
  const createDateTime = (date, time) => {
    if (!date || !time) return null;
    return new Date(`${date}T${time}:00`);
  };

  // Helper function to calculate end time
  const calculateEndTime = (startTime, duration) => {
    if (!startTime || !duration) return null;

    const startDate = new Date(startTime);
    const endDate = new Date(startDate.getTime() + duration * 60000);
    return endDate;
  };

  // Handle service selection
  const handleServiceChange = (serviceId) => {
    const service = services.find(s => s._id === serviceId);
    if (service) {
      setSelectedService(service);
      setFormData(prev => ({
        ...prev,
        serviceId: serviceId,
        duration: service.duration?.estimated || 60,
        price: service.pricing?.basePrice || 0
      }));
    }
  };

  const handleClientChange = (clientId) => {
    console.log('Selected client ID:', clientId);
    // Use 'id' property instead of '_id' since you mentioned clients have 'id' property
    const client = clients.find(c => c.id === clientId || c._id === clientId);
    console.log('Found client:', client);
    setSelectedClient(client);
    setFormData(prev => ({
      ...prev,
      clientId,
      petId: '' // Reset pet selection when client changes
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug: Log the form data
    console.log('Form data being submitted:', formData);
    console.log('Available clients:', clients);

    // Enhanced validation with specific field checking
    const requiredFields = [
      { name: 'clientId', value: formData.clientId, label: 'Client' },
      { name: 'serviceId', value: formData.serviceId, label: 'Service' },
      { name: 'date', value: formData.date, label: 'Date' },
      { name: 'startTime', value: formData.startTime, label: 'Start Time' }
    ];

    const missingFields = requiredFields.filter(field => isFieldEmpty(field.value));

    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => field.label).join(', ');
      toast.error(`Please fill in: ${fieldNames}`);
      console.log('Missing fields:', missingFields);
      return;
    }

    // Additional validation for business ID
    if (!formData.businessId) {
      toast.error('Business ID is missing. Please refresh and try again.');
      return;
    }

    // Check if we have a pet ID (required by backend)
    const currentClient = isClientUser ? user : selectedClient;
    const petId = formData.petId || currentClient?.pets?.[0]?.id || currentClient?.pets?.[0]?._id;
    if (!petId) {
      toast.error('Pet selection is required. Please select a pet or add one to the client.');
      return;
    }

    // Send flat structure that matches your backend validation
    const appointmentData = {
      businessId: formData.businessId,
      clientId: formData.clientId,
      serviceName: selectedService?.name || '',
      serviceId: selectedService?._id || '',
      petId: petId,
      service: {
        id: formData.serviceId, // Send the service ID
        name: selectedService?.name || '',
        description: selectedService?.description || ''
      },
      duration: formData.duration,
      price: formData.price,
      date: formData.date, // Send as string in YYYY-MM-DD format
      startTime: formData.startTime, // Send as string in HH:MM format
      notes: formData.notes || '',
      specialRequests: formData.specialRequests || '',
      createdBy: user._id
    };


    console.log('Transformed appointment data to be sent:', appointmentData);

    try {
      await dispatch(createAppointment(appointmentData)).unwrap();
      toast.success('Appointment created successfully!');
      onSuccess && onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error(error.message || 'Failed to create appointment');
    }
  };
  console.log(services, "gogogogogoogog")
  const resetForm = () => {
    setFormData({
      businessId: user?.business?.[0]?._id || '',
      clientId: isClientUser ? (user._id || user.id) : '',
      petId: '',
      serviceId: '',
      duration: 60,
      price: 0,
      date: '',
      startTime: '',
      notes: '',
      specialRequests: ''
    });

    if (!isClientUser) {
      setSelectedClient(null);
      setAvailablePets([]);
    }

    setSelectedService(null);

    setShowNewClientForm(false);
    setNewClientData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      petName: '',
      petSpecies: 'dog',
      petBreed: ''
    });
  };

  const handleCreateNewClient = () => {
    // This would integrate with your client creation logic
    toast.info('New client creation feature coming soon!');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Create New Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Client Selection - Show differently for client users */}
          {isClientUser ? (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Client Information
              </label>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center space-x-3">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.profile?.firstName || user.firstName} {user.profile?.lastName || user.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{user.profile?.email || user.email}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Select Client <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="flex-1 input-field"
                  required
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client.id || client._id} value={client.id || client._id}>
                      {client.profile?.firstName || client.firstName} {client.profile?.lastName || client.lastName} - {client.profile?.email || client.email}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(true)}
                  className="btn-secondary flex items-center whitespace-nowrap"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  New Client
                </button>
              </div>
              {clients.length === 0 && (
                <p className="text-sm text-gray-500">No clients found. Please add a client first.</p>
              )}
            </div>
          )}

          {/* Pet Selection - Now Required */}
          {(selectedClient || isClientUser) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Pet <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.petId}
                onChange={(e) => handleInputChange('petId', e.target.value)}
                className="input-field"
                required
              >
                <option value="">Choose a pet...</option>
                {availablePets.map((pet) => (
                  <option key={pet.id || pet._id} value={pet.id || pet._id}>
                    {pet.profile?.name || pet.name} ({pet.profile?.species || pet.species}) - {pet.profile?.breed || pet.breed}
                  </option>
                ))}
              </select>
              {availablePets.length === 0 && (
                <p className="text-sm text-red-500 mt-1">
                  No pets found. Please add a pet first before creating an appointment.
                </p>
              )}
            </div>
          )}

          {!selectedClient && !isClientUser && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-700">
                Please select a client first to see available pets.
              </p>
            </div>
          )}

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Service <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Choose a service...</option>
              {services?.map((service) => (
                <option key={service._id} value={service._id}>
                  {service.name} - ₹{service.pricing?.basePrice} ({service.duration?.estimated} mins)
                </option>
              )) || []}
            </select>
            {services?.services?.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No services available. Please contact the business to add services.
              </p>
            )}
          </div>





           {isClientUser && (
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Select Business <span className="text-red-500">*</span>
             </label>
             <select
               value={formData.businessId}
               onChange={e => handleServiceChange(e.target.value)}
               className="input-field w-full"
               required
             >
               <option value="">Choose a business…</option>
               {businesses.map(b => (
                 <option key={b._id} value={b._id}>
                   {b.profile.name}
                 </option>
               ))}
             </select>
             {businesses.length === 0 && (
               <p className="text-sm text-red-500 mt-1">
                 No businesses available. Please contact support.
               </p>
             )}
           </div>
         )}

          {/* Service Details - Show when service is selected */}
          {selectedService && (
            <div className="bg-gray-50 p-4 rounded-md space-y-2">
              <h4 className="font-medium text-gray-900">{selectedService.name}</h4>
              {selectedService.description && (
                <p className="text-sm text-gray-600">{selectedService.description}</p>
              )}
              <div className="flex gap-4 text-sm text-gray-500">
                <span>Duration: {selectedService.duration?.estimated} minutes</span>
                <span>Price: ₹{selectedService.pricing?.basePrice}</span>
              </div>
            </div>
          )}

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange('startTime', e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₹)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                className="input-field"
                min="0"
                step="0.01"
                placeholder="0.00"
                readOnly={isClientUser || selectedService} // Read-only for clients or when service is selected
              />
              {selectedService && (
                <p className="text-xs text-gray-500 mt-1">Price set by selected service</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="input-field"
              rows="3"
              placeholder="Any additional notes or instructions..."
            />
          </div>

          {/* Special Requests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests
            </label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => handleInputChange('specialRequests', e.target.value)}
              className="input-field"
              rows="2"
              placeholder="Any special requests from the client..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
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
                  Creating...
                </>
              ) : (
                <>
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Create Appointment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentCreateForm;