// client/src/components/landing/LandingDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  UserIcon, 
  PhoneIcon, 
  XMarkIcon,
  SparklesIcon,
  HeartIcon,
  HomeIcon,
  AcademicCapIcon,
  MapPinIcon,
  StarIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { publicSearchAPI } from '../services/api';

const LandingDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [locationPermission, setLocationPermission] = useState('prompt'); // 'prompt', 'granted', 'denied'
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  // Default categories as fallback
  const defaultCategories = [
    {
      _id: 'default-1',
      name: 'Pet Grooming',
      icon: 'SparklesIcon',
      color: '#3B82F6',
      description: 'Professional pet grooming services'
    },
    {
      _id: 'default-2',
      name: 'Veterinary Clinic',
      icon: 'HeartIcon',
      color: '#10B981',
      description: 'Complete veterinary care'
    },
    {
      _id: 'default-3',
      name: 'Pet Boarding',
      icon: 'HomeIcon',
      color: '#F59E0B',
      description: 'Safe and comfortable pet boarding'
    },
    {
      _id: 'default-4',
      name: 'Pet Training',
      icon: 'AcademicCapIcon',
      color: '#8B5CF6',
      description: 'Professional pet training services'
    }
  ];

  // Icon mapping
  const iconMap = {
    SparklesIcon: SparklesIcon,
    HeartIcon: HeartIcon,
    HomeIcon: HomeIcon,
    AcademicCapIcon: AcademicCapIcon,
    BuildingOfficeIcon: BuildingOfficeIcon
  };

  // Load categories and check location permission on component mount
  useEffect(() => {
    loadCategories();
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      setLocationPermission('denied');
      return;
    }

    try {
      // Check if permission is already granted
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);
      
      if (permission.state === 'granted') {
        getCurrentLocation();
      } else if (permission.state === 'prompt') {
        // Show location modal on first search attempt
        setShowLocationModal(true);
      }
    } catch (error) {
      console.error('Error checking location permission:', error);
      setLocationPermission('prompt');
    }
  };

  const getCurrentLocation = () => {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 600000 // 10 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        setUserLocation(location);
        setLocationPermission('granted');
        setLocationError(null);
        toast.success('Location enabled! You\'ll see nearby businesses first.');
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationPermission('denied');
        
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
      },
      options
    );
  };

  const requestLocationPermission = () => {
    setShowLocationModal(false);
    getCurrentLocation();
  };

  const skipLocationPermission = () => {
    setShowLocationModal(false);
    setLocationPermission('denied');
    toast.info('Searching without location. Results may be less accurate.');
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await publicSearchAPI.getCategories();
      
      if (response.data?.success && response.data.data?.length > 0) {
        setCategories(response.data.data);
      } else {
        // Use default categories if API fails
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(defaultCategories);
      toast.error('Failed to load categories, showing defaults');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    setSearchQuery(category.name);
    
    // Check if we need to ask for location permission
    if (locationPermission === 'prompt' && !showLocationModal) {
      setShowLocationModal(true);
      return;
    }
    
    await searchBusinesses(category.name);
  };

  const searchBusinesses = async (query) => {
    try {
      setLoading(true);
      const params = {
        q: query,
        category: selectedCategory?._id || '',
        limit: 12,
        radius: 50 // 50km radius
      };

      // Use user's location if available, otherwise use default location
      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      } else {
        // Default to Delhi if no location
        params.latitude = 28.6139;
        params.longitude = 77.2090;
      }

      const response = await publicSearchAPI.searchBusinesses(params);
      
      if (response.data?.success) {
        setBusinesses(response.data.data || []);
        if (response.data.data?.length === 0) {
          toast.info('No businesses found for your search');
        }
      } else {
        setBusinesses([]);
        toast.error('No businesses found');
      }
    } catch (error) {
      console.error('Error searching businesses:', error);
      setBusinesses([]);
      toast.error('Failed to search businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }
    
    // Check if we need to ask for location permission first
    if (locationPermission === 'prompt' && !showLocationModal) {
      setShowLocationModal(true);
      return;
    }
    
    setShowPhoneModal(true);
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    // Validate phone number format
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    setShowPhoneModal(false);
    await searchBusinesses(searchQuery);
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleContactBusiness = async (business) => {
    try {
      const inquiryData = {
        businessId: business._id,
        customerName: '',
        customerPhone: phoneNumber,
        customerEmail: '',
        message: `Interested in ${business.profile?.name || business.name} services`,
        serviceInterest: selectedCategory?.name || 'General Inquiry'
      };

      await publicSearchAPI.submitInquiry(inquiryData);
      toast.success('Your inquiry has been sent!');
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error('Failed to send inquiry');
    }
  };

  const renderBusinessCard = (business) => (
    <div key={business._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
      <div className="relative">
        <img
          src={business.profile?.logo || 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop'}
          alt={business.profile?.name || business.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium">
          {business.distance ? `${business.distance}km` : 'Nearby'}
        </div>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xl font-bold text-gray-900">
            {business.profile?.name || business.name}
          </h4>
          <div className="flex items-center">
            <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
            <span className="ml-1 text-sm font-medium text-gray-700">
              {business.rating || '4.5'}
            </span>
            <span className="ml-1 text-sm text-gray-500">
              ({business.reviewCount || '0'})
            </span>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPinIcon className="h-4 w-4 mr-2" />
          <span className="text-sm">
            {business.profile?.address ? 
              `${business.profile.address.street}, ${business.profile.address.city}` : 
              'Address not available'
            }
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {business.services?.slice(0, 3).map((service, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
            >
              {service.name}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            <span className="text-sm">
              {business.profile?.phone || 'Contact for details'}
            </span>
          </div>
          <button 
            onClick={() => handleContactBusiness(business)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <HeartIcon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900">PetSync</h1>
                <p className="text-sm text-gray-500">Find the best pet services near you</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Location Status Indicator */}
              <div className="flex items-center text-sm">
                {locationPermission === 'granted' && userLocation ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    <span>Location enabled</span>
                  </div>
                ) : locationPermission === 'denied' ? (
                  <div className="flex items-center text-orange-600">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                    <span>Location disabled</span>
                  </div>
                ) : null}
              </div>
              
              <button
                onClick={handleLogin}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl">
              Find Amazing
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> Pet Services</span>
            </h2>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Discover trusted pet grooming, veterinary care, boarding, and training services in your area. 
              Your pet deserves the best care.
            </p>
            
            {/* Search Bar */}
            <div className="mt-10 max-w-2xl mx-auto">
              <div className="relative">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for pet services, grooming, vet clinics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="absolute right-2 top-2 bottom-2 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900">Popular Services</h3>
            <p className="mt-4 text-lg text-gray-600">Browse by category to find exactly what you need</p>
          </div>
          
          {categoriesLoading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => {
                const IconComponent = iconMap[category.icon] || SparklesIcon;
                return (
                  <div
                    key={category._id}
                    onClick={() => handleCategoryClick(category)}
                    className="group cursor-pointer bg-white rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div 
                      className="rounded-xl p-4 w-16 h-16 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200"
                      style={{ backgroundColor: category.color || '#3B82F6' }}
                    >
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">{category.name}</h4>
                    <p className="text-gray-600">{category.description}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Search Results */}
      {(loading || businesses.length > 0) && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-gray-900">
                {loading ? 'Searching...' : `Found ${businesses.length} Results`}
              </h3>
              {selectedCategory && (
                <p className="mt-2 text-lg text-gray-600">
                  Showing results for "{selectedCategory.name}"
                  {userLocation && ' near your location'}
                </p>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            ) : businesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {businesses.map(renderBusinessCard)}
              </div>
            ) : (
              <div className="text-center">
                <div className="mx-auto w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon className="h-16 w-16 text-gray-400" />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h4>
                <p className="text-gray-600">Try searching with different keywords or browse our categories.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Location Permission Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Enable Location</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-center mb-6">
              <MapPinIcon className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                To show you the most relevant pet services, we'd like to access your location.
                This helps us find businesses near you and show accurate distances.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <strong>Why we need location:</strong>
                <ul className="mt-2 list-disc list-inside text-left">
                  <li>Find nearby pet services</li>
                  <li>Show accurate distances</li>
                  <li>Prioritize local businesses</li>
                  <li>Faster service recommendations</li>
                </ul>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={skipLocationPermission}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip for now
              </button>
              <button
                onClick={requestLocationPermission}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Enable Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Enter Your Phone Number</h3>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              We need your phone number to show you personalized results and help businesses contact you.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 12345 67890"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowPhoneModal(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePhoneSubmit}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <HeartIcon className="h-6 w-6 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold">PetSync</span>
              </div>
              <p className="text-gray-400 mb-4">
                Connecting pet owners with the best pet services in their area. Your pet's health and happiness is our priority.
              </p>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Pet Grooming</li>
                <li>Veterinary Care</li>
                <li>Pet Boarding</li>
                <li>Pet Training</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>support@petsync.com</li>
                <li>+91 12345 67890</li>
                <li>24/7 Customer Support</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 PetSync. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingDashboard;