import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SparklesIcon,
  HeartIcon,
  HomeIcon,
  AcademicCapIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { publicSearchAPI } from '../services/api';
import RenderNoResultsWithSuggestions from './LandingDashboard/RenderNoResultsWithSuggestions';
import RenderBusinessCard from './LandingDashboard/RenderBusinessCard';
import Header from './LandingDashboard/Header';
import HeroSection from './LandingDashboard/HeroSection';
import SearchResults from './LandingDashboard/SearchResults';
import LocationPermissionModal from './LandingDashboard/LocationPermissionModal';
import PhoneNumberModal from './LandingDashboard/PhoneNumberModal';
import Footer from './LandingDashboard/Footer';

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
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false); // New state to track if user has searched
  const [pendingContactBusiness, setPendingContactBusiness] = useState(null); // Store business for pending contact
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);


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
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);

      if (permission.state === 'granted') {
        getCurrentLocation();
      } else if (permission.state === 'prompt') {
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
      maximumAge: 600000
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
    // toast.info('Searching without location. Results may be less accurate.');
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await publicSearchAPI.getCategories();

      if (response.data?.success && response.data.data?.length > 0) {
        setCategories(response.data.data);
      } else {
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




  // 2. Function to fetch suggestions from database when no results found
  const fetchSuggestions = async (originalQuery) => {
    try {
      setLoadingSuggestions(true);

      // Strategy 1: Get similar business names
      const businessSuggestions = await getSimilarBusinesses(originalQuery);

      // Strategy 2: Get available services from database
      const serviceSuggestions = await getAvailableServices(originalQuery);

      // Strategy 3: Get popular searches from other users
      const popularSuggestions = await getPopularSearches();

      // Strategy 4: Get suggestions from categories that have businesses
      const categorySuggestions = await getCategoriesWithBusinesses();

      // Combine and rank suggestions
      const allSuggestions = [
        ...businessSuggestions,
        ...serviceSuggestions,
        ...popularSuggestions,
        ...categorySuggestions
      ];

      // Remove duplicates and limit to 8 suggestions
      const uniqueSuggestions = Array.from(
        new Map(allSuggestions.map(item => [item.query, item])).values()
      ).slice(0, 8);

      setSuggestions(uniqueSuggestions);

    } catch (error) {
      console.error('Error fetching suggestions:', error);
      // Fallback to category-based suggestions
      await getFallbackSuggestions();
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // 3. Get similar business names from database
  const getSimilarBusinesses = async (query) => {
    try {
      const params = {
        q: '', // Empty query to get all businesses
        limit: 50, // Get more businesses to analyze
        latitude: userLocation?.latitude || 28.6139,
        longitude: userLocation?.longitude || 77.2090,
        radius: 100 // Wider radius for suggestions
      };

      const response = await publicSearchAPI.searchBusinesses(params);

      if (response.data?.success && response.data.data) {
        const businesses = response.data.data;
        const suggestions = [];

        // Extract business names and create suggestions
        businesses.forEach(business => {
          const businessName = business.profile?.name || business.name;
          if (businessName) {
            suggestions.push({
              query: businessName,
              type: 'business',
              count: 1,
              source: 'business_name'
            });
          }
        });

        return suggestions.slice(0, 3); // Limit business name suggestions
      }

      return [];
    } catch (error) {
      console.error('Error getting similar businesses:', error);
      return [];
    }
  };

  // 4. Get available services from businesses in database
  const getAvailableServices = async (query) => {
    try {
      const params = {
        q: '', // Get all businesses to extract their services
        limit: 100,
        latitude: userLocation?.latitude || 28.6139,
        longitude: userLocation?.longitude || 77.2090,
        radius: 100
      };

      const response = await publicSearchAPI.searchBusinesses(params);

      if (response.data?.success && response.data.data) {
        const businesses = response.data.data;
        const serviceMap = new Map();

        // Extract all services from businesses
        businesses.forEach(business => {
          if (business.services && Array.isArray(business.services)) {
            business.services.forEach(service => {
              if (service.name) {
                const serviceName = service.name.toLowerCase();
                const count = serviceMap.get(serviceName) || 0;
                serviceMap.set(serviceName, count + 1);
              }
            });
          }
        });

        // Convert to suggestions array and sort by popularity
        const serviceSuggestions = Array.from(serviceMap.entries())
          .map(([serviceName, count]) => ({
            query: serviceName,
            type: 'service',
            count: count,
            source: 'business_services'
          }))
          .sort((a, b) => b.count - a.count) // Sort by popularity
          .slice(0, 4); // Top 4 services

        return serviceSuggestions;
      }

      return [];
    } catch (error) {
      console.error('Error getting available services:', error);
      return [];
    }
  };

  // 5. Get popular searches (could be from analytics or search history)
  const getPopularSearches = async () => {
    try {
      // This would typically come from your analytics/search history API
      // For now, we'll derive from categories that have businesses
      const categorySuggestions = await getCategoriesWithBusinesses();

      return categorySuggestions.map(cat => ({
        query: cat.query,
        type: 'popular',
        count: cat.count,
        source: 'popular_category'
      })).slice(0, 2);

    } catch (error) {
      console.error('Error getting popular searches:', error);
      return [];
    }
  };


  // 6. Get categories that actually have businesses
  const getCategoriesWithBusinesses = async () => {
    try {
      const suggestions = [];

      // Check each category to see if it has businesses
      for (const category of categories) {
        try {
          const params = {
            q: category.name,
            category: category._id,
            limit: 1, // Just check if any exist
            latitude: userLocation?.latitude || 28.6139,
            longitude: userLocation?.longitude || 77.2090,
            radius: 100
          };

          const response = await publicSearchAPI.searchBusinesses(params);

          if (response.data?.success && response.data.data?.length > 0) {
            suggestions.push({
              query: category.name,
              type: 'category',
              count: response.data.data.length,
              source: 'active_category',
              categoryData: category
            });
          }
        } catch (error) {
          console.error(`Error checking category ${category.name}:`, error);
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error getting categories with businesses:', error);
      return [];
    }
  };

  // 7. Fallback suggestions when API calls fail
  const getFallbackSuggestions = async () => {
    const fallbackSuggestions = categories.slice(0, 6).map(category => ({
      query: category.name,
      type: 'category',
      count: 0,
      source: 'fallback',
      categoryData: category
    }));

    setSuggestions(fallbackSuggestions);
  };


  const handleCategoryClick = async (category) => {
    setSelectedCategory(category);
    setSearchQuery(category.name);

    // Check for phone number first
    if (!phoneNumber.trim()) {
      setShowPhoneModal(true);
      return;
    }

    // Check location permission
    if (locationPermission === 'prompt' && !showLocationModal) {
      setShowLocationModal(true);
      return;
    }

    // This already passes category correctly
    await searchBusinesses(category.name, category);
  };

  const searchBusinesses = async (query, category = null) => {
    try {
      setLoading(true);
      setHasSearched(true);

      const params = {
        q: query,
        limit: 12,
        radius: 50
      };

      if (category) {
        params.category = category._id;
      }

      if (userLocation) {
        params.latitude = userLocation.latitude;
        params.longitude = userLocation.longitude;
      } else {
        params.latitude = 28.6139;
        params.longitude = 77.2090;
      }

      const response = await publicSearchAPI.searchBusinesses(params);

      if (response.data?.success) {
        setBusinesses(response.data.data || []);

        // If no results found, automatically fetch database-based suggestions
        if (response.data.data?.length === 0) {
          await fetchSuggestions(query);
        }
      } else {
        setBusinesses([]);
        await fetchSuggestions(query);
      }
    } catch (error) {
      console.error('Error searching businesses:', error);
      setBusinesses([]);
      await fetchSuggestions(query);
      toast.error('Failed to search businesses');
    } finally {
      setLoading(false);
    }
  };


  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion.query);

    if (suggestion.categoryData) {
      // This is a category suggestion
      setSelectedCategory(suggestion.categoryData);
      await searchBusinesses(suggestion.query, suggestion.categoryData);
    } else {
      // This is a service/business name suggestion
      setSelectedCategory(null);
      await searchBusinesses(suggestion.query, null);
    }
  };


  const handleSearch = async (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      toast.error('Please enter a search term');
      return;
    }

    // Check for phone number first
    if (!phoneNumber.trim()) {
      setShowPhoneModal(true);
      return;
    }

    // Check location permission
    if (locationPermission === 'prompt' && !showLocationModal) {
      setShowLocationModal(true);
      return;
    }

    // FIXED: Always clear category when user manually types and searches
    // This ensures manual searches are never filtered by category
    setSelectedCategory(null);
    await searchBusinesses(searchQuery, null);
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

    // If there's a pending contact, handle it
    if (pendingContactBusiness) {
      await handleContactBusiness(pendingContactBusiness);
      setPendingContactBusiness(null);
      return;
    }

    // FIXED: Check if there's a selectedCategory (from category click) or just search query
    if (selectedCategory && searchQuery === selectedCategory.name) {
      // This was a category search - use the category
      await searchBusinesses(searchQuery, selectedCategory);
    } else if (searchQuery) {
      // This was a text search - don't use category
      await searchBusinesses(searchQuery, null);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleContactBusiness = async (business) => {
    // Check if phone number is provided
    if (!phoneNumber.trim()) {
      setPendingContactBusiness(business);
      setShowPhoneModal(true);
      return;
    }

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

  // 10. Updated render function for no results with database suggestions
  const renderNoResultsWithSuggestions = () => {
    return (
      <RenderNoResultsWithSuggestions
        searchQuery={searchQuery}
        loadingSuggestions={loadingSuggestions}
        suggestions={suggestions}
        handleSuggestionClick={handleSuggestionClick}
      />
    );
  };



  const renderBusinessCard = (business) => (
    <RenderBusinessCard
      business={business}
      handleContactBusiness={handleContactBusiness}
    />
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <Header locationPermission={locationPermission} userLocation={userLocation} handleLogin={handleLogin} />

      {/* Hero Section */}
      <HeroSection handleSearch={handleSearch} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Search Results - Now positioned right after Hero section */}
      <SearchResults
        hasSearched={hasSearched}
        loading={loading}
        businesses={businesses}
        suggestions={suggestions}
        selectedCategory={selectedCategory}
        userLocation={userLocation}
        renderBusinessCard={renderBusinessCard}
        renderNoResultsWithSuggestions={renderNoResultsWithSuggestions}
        categoriesLoading={categoriesLoading}
        categories={categories}
        iconMap={iconMap}
        SparklesIcon={SparklesIcon}
        handleCategoryClick={handleCategoryClick}
      />

      {/* Location Permission Modal */}
      <LocationPermissionModal
        showLocationModal={showLocationModal}
        setShowLocationModal={setShowLocationModal}
        skipLocationPermission={skipLocationPermission}
        requestLocationPermission={requestLocationPermission}
      />

      {/* Phone Number Modal */}
      <PhoneNumberModal
        showPhoneModal={showPhoneModal}
        setShowPhoneModal={setShowPhoneModal}
        pendingContactBusiness={pendingContactBusiness}
        handlePhoneSubmit={handlePhoneSubmit}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        setPendingContactBusiness={setPendingContactBusiness}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingDashboard;