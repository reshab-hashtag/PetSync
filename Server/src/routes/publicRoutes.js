// server/src/routes/publicRoutes.js
const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const BusinessCategory = require('../models/BusinessCategory');
const Inquiry = require('../models/Inquiry');
const { body, validationResult } = require('express-validator');

// Get all active business categories for public display
router.get('/categories', async (req, res) => {
  try {
    const categories = await BusinessCategory.find({ 
      isActive: true 
    })
    .select('name description icon color slug displayOrder')
    .sort({ displayOrder: 1, name: 1 });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

// Search businesses with filters
router.get('/search/businesses', async (req, res) => {
  console.log('Search query:', req.query);
  try {
    const {
      q = '',
      category = '',
      latitude,
      longitude,
      radius = 50,
      limit = 12,
      page = 1
    } = req.query;

    // Build search query
    const searchQuery = {
      isActive: true
    };

    // Text search
    if (q) {
      searchQuery.$or = [
        { 'profile.name': { $regex: q, $options: 'i' } },
        { 'profile.companyName': { $regex: q, $options: 'i' } },
        { 'profile.description': { $regex: q, $options: 'i' } },
        { 'services.name': { $regex: q, $options: 'i' } },
        { 'services.description': { $regex: q, $options: 'i' } }
      ];
    }

    // Category filter - handle both ObjectId and string
    if (category) {
      try {
        // Try to use as ObjectId first
        const mongoose = require('mongoose');
        if (mongoose.Types.ObjectId.isValid(category)) {
          searchQuery['profile.category'] = category;
        } else {
          // If not valid ObjectId, search by category name
          const BusinessCategory = require('../models/BusinessCategory');
          const categoryDoc = await BusinessCategory.findOne({ 
            $or: [
              { name: { $regex: category, $options: 'i' } },
              { slug: category.toLowerCase() }
            ]
          });
          if (categoryDoc) {
            searchQuery['profile.category'] = categoryDoc._id;
          }
        }
      } catch (err) {
        console.error('Category filter error:', err);
      }
    }

    console.log('Search query before location:', JSON.stringify(searchQuery, null, 2));

    // Location-based search - simplified approach
    let useLocationSearch = false;
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      
      // Check if coordinates are valid
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        try {
          // First, try to see if any businesses have location data
          const businessesWithLocation = await Business.countDocuments({
            'profile.location': { $exists: true, $ne: null }
          });
          
          console.log('Businesses with location data:', businessesWithLocation);
          
          if (businessesWithLocation > 0) {
            // Use geospatial query only if location data exists
            searchQuery['profile.location'] = {
              $near: {
                $geometry: {
                  type: 'Point',
                  coordinates: [lng, lat] // MongoDB expects [longitude, latitude]
                },
                $maxDistance: radius * 1000 // Convert km to meters
              }
            };
            useLocationSearch = true;
          }
        } catch (locationError) {
          console.error('Location search error:', locationError);
          // Continue without location search if it fails
        }
      }
    }

    console.log('Final search query:', JSON.stringify(searchQuery, null, 2));
    console.log('Using location search:', useLocationSearch);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute the search
    let businesses;
    try {
      businesses = await Business.find(searchQuery)
        .populate('profile.category', 'name color icon slug')
        .select('profile services rating reviewCount createdAt')
        .sort({ 
          ...(useLocationSearch ? {} : { rating: -1, reviewCount: -1, createdAt: -1 })
        })
        .limit(parseInt(limit))
        .skip(skip);
    } catch (searchError) {
      console.error('Search execution error:', searchError);
      
      // If geospatial search fails, retry without location
      if (useLocationSearch) {
        console.log('Retrying search without location...');
        delete searchQuery['profile.location'];
        
        businesses = await Business.find(searchQuery)
          .populate('profile.category', 'name color icon slug')
          .select('profile services rating reviewCount createdAt')
          .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
          .limit(parseInt(limit))
          .skip(skip);
        
        useLocationSearch = false;
      } else {
        throw searchError;
      }
    }

    console.log('Found businesses:', businesses.length);

    // Calculate distance if coordinates provided and we have businesses
    const businessesWithDistance = businesses.map(business => {
      let distance = null;
      
      if (latitude && longitude && business.profile.location && business.profile.location.coordinates) {
        try {
          const lat1 = parseFloat(latitude);
          const lon1 = parseFloat(longitude);
          const lat2 = business.profile.location.coordinates[1]; // GeoJSON format: [lng, lat]
          const lon2 = business.profile.location.coordinates[0];
          
          // Haversine formula for distance calculation
          const R = 6371; // Earth's radius in km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = R * c;
        } catch (distanceError) {
          console.error('Distance calculation error:', distanceError);
        }
      }

      return {
        ...business.toObject(),
        distance: distance ? Math.round(distance * 10) / 10 : null,
        hasLocation: !!(business.profile.location && business.profile.location.coordinates)
      };
    });

    // Sort by distance if location search was used
    if (useLocationSearch && latitude && longitude) {
      businessesWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    // Get total count (without location filter for accurate pagination)
    const countQuery = { ...searchQuery };
    if (useLocationSearch) {
      delete countQuery['profile.location'];
    }
    const totalCount = await Business.countDocuments(countQuery);

    res.json({
      success: true,
      data: businessesWithDistance,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalCount / parseInt(limit)),
        count: businesses.length,
        totalRecords: totalCount
      },
      searchInfo: {
        query: q,
        category: category,
        location: latitude && longitude ? { lat: latitude, lng: longitude, radius } : null,
        useLocationSearch,
        hasLocationData: businessesWithDistance.some(b => b.hasLocation)
      }
    });

  } catch (error) {
    console.error('Error searching businesses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search businesses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      debug: {
        query: req.query,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Get business details by ID
router.get('/businesses/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id)
      .populate('profile.category', 'name color icon')
      .select('profile services schedule rating reviewCount createdAt');

    if (!business || !business.isActive || !business.profile.isPublic) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    res.json({
      success: true,
      data: business
    });
  } catch (error) {
    console.error('Error fetching business details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business details'
    });
  }
});

// Get businesses by category
router.get('/categories/:categoryId/businesses', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 12, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const businesses = await Business.find({
      'profile.category': categoryId,
      isActive: true,
      'profile.isPublic': true
    })
    .populate('profile.category', 'name color icon')
    .select('profile services rating reviewCount')
    .sort({ rating: -1, reviewCount: -1 })
    .limit(parseInt(limit))
    .skip(skip);

    const totalCount = await Business.countDocuments({
      'profile.category': categoryId,
      isActive: true,
      'profile.isPublic': true
    });

    res.json({
      success: true,
      data: businesses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalCount / parseInt(limit)),
        count: businesses.length,
        totalRecords: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching businesses by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch businesses'
    });
  }
});

// Submit inquiry/contact form
router.post('/inquiries', [
  body('businessId').isMongoId().withMessage('Valid business ID is required'),
  body('customerPhone').isMobilePhone().withMessage('Valid phone number is required'),
  body('message').isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      businessId,
      customerName,
      customerPhone,
      customerEmail,
      message,
      serviceInterest
    } = req.body;

    // Verify business exists and is active
    const business = await Business.findById(businessId);
    if (!business || !business.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Create inquiry
    const inquiry = new Inquiry({
      business: businessId,
      customer: {
        name: customerName || 'Anonymous',
        phone: customerPhone,
        email: customerEmail || ''
      },
      message,
      serviceInterest: serviceInterest || 'General Inquiry',
      source: 'website',
      status: 'pending'
    });

    await inquiry.save();

    // TODO: Send notification to business owner
    // You can implement email/SMS notifications here

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: {
        inquiryId: inquiry._id,
        status: inquiry.status
      }
    });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry'
    });
  }
});

// Get nearby businesses
router.get('/businesses/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const businesses = await Business.find({
      isActive: true,
      'profile.isPublic': true,
      'profile.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: radius * 1000
        }
      }
    })
    .populate('profile.category', 'name color icon')
    .select('profile services rating reviewCount')
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: businesses
    });
  } catch (error) {
    console.error('Error fetching nearby businesses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby businesses'
    });
  }
});

module.exports = router;