// controllers/petController.js - Fixed for your multiple business structure
const { ROLES } = require('../config/constants');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Helper function to get business ID from user (updated for your structure)
const getBusinessId = (user) => {
  console.log('=== GET BUSINESS ID DEBUG ===');
  console.log('User structure:', JSON.stringify(user, null, 2));
  
  let businessId = null;
  
  // Your structure: user.userData.business[0]._id
  if (user.userData && user.userData.business && user.userData.business.length > 0) {
    const business = user.userData.business[0];
    businessId = typeof business === 'object' && business._id ? business._id : business;
    console.log('Found business ID from userData.business[0]._id:', businessId);
  }
  // Fallback: user.business[0]._id
  else if (user.business && user.business.length > 0) {
    const business = user.business[0];
    businessId = typeof business === 'object' && business._id ? business._id : business;
    console.log('Found business ID from business[0]._id:', businessId);
  }
  // Fallback: direct businessId property
  else if (user.businessId) {
    businessId = user.businessId;
    console.log('Found business ID from businessId:', businessId);
  }
  // Fallback: direct user ID for clients
  else if (user.userId && user.role === 'client') {
    businessId = user.userId;
    console.log('Using userId as fallback for client:', businessId);
  }
  
  console.log('Final businessId:', businessId);
  console.log('=== END GET BUSINESS ID DEBUG ===\n');
  
  return businessId;
};

// Helper function to get all business IDs for a user
function getAllBusinessIds(user) {
  console.log(user)
  const bizArr = user.userData?.business || [];
  return bizArr.map(b => {
    // if it's a full document, grab ._id, otherwise it's already an ID
    const id = (typeof b === 'object' && b._id) ? b._id : b;
    return id.toString();
  });
}

// Helper function to get user ID
const getUserId = (user) => {
  return  user.id;
};

// @desc    Get all pets for business
// @route   GET /api/pets
// @access  Private
exports.getPets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const userRole = req.user.role;
    const businessIds = req.user.userData.business;
    
    // Handle pagination - if limit is 'all' or not provided, return all pets
    const page = parseInt(req.query.page, 10) || 1;
    const limit = req.query.limit === 'all' ? null : parseInt(req.query.limit, 10) || null;
    const skip = limit ? (page - 1) * limit : 0;
    
    const { search, species, status, owner } = req.query;

    // ==================== CLIENT LOGIC ====================
    if (userRole === ROLES.CLIENT) {
      const user = await User.findById(userId).select('pets').populate({
        path: 'pets',
        populate: [
          { path: 'createdBy', select: 'profile.firstName profile.lastName' },
          { path: 'owner', select: 'profile.firstName profile.lastName profile.email' },
        ],
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Apply filtering manually on user.pets
      let filteredPets = user.pets;

      // Text search
      if (search) {
        const regex = new RegExp(search, 'i');
        filteredPets = filteredPets.filter(pet =>
          regex.test(pet.profile?.name || '') ||
          regex.test(pet.profile?.breed || '') ||
          regex.test(pet.profile?.microchipId || '')
        );
      }

      // Filters
      if (species && species !== 'all') {
        filteredPets = filteredPets.filter(pet => pet.profile?.species === species);
      }
      if (status && status !== 'all') {
        filteredPets = filteredPets.filter(pet => pet.status === status);
      }

      const total = filteredPets.length;
      
      // Apply pagination only if limit is specified
      const paginatedPets = limit ? filteredPets.slice(skip, skip + limit) : filteredPets;

      return res.status(200).json({
        success: true,
        data: paginatedPets,
        pagination: {
          page: limit ? page : 1,
          limit: limit || total,
          total,
          totalPages: limit ? Math.ceil(total / limit) : 1
        }
      });
    }

    // ==================== BUSINESS ADMIN / STAFF / SUPER ADMIN ====================
    let query = {};

    if (userRole === ROLES.BUSINESS_ADMIN) {
      if (!businessIds.length) {
        return res.status(400).json({
          success: false,
          message: 'You have no businesses assigned.'
        });
      }
      query.business = { $in: businessIds };
    } else if (userRole === ROLES.SUPER_ADMIN) {
      query = {};
    } else {
      query.business = { $in: businessIds };
    }

    // Add filters
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { 'profile.name': { $regex: search, $options: 'i' } },
          { 'profile.breed': { $regex: search, $options: 'i' } },
          { 'profile.microchipId': { $regex: search, $options: 'i' } }
        ]
      });
    }
    if (species && species !== 'all') query['profile.species'] = species;
    if (status && status !== 'all') query.status = status;
    if (owner && userRole !== ROLES.CLIENT) query.owner = owner;

    const total = await Pet.countDocuments(query);
    
    // Build the query with optional pagination
    let petQuery = Pet.find(query)
      .populate('owner', 'profile.firstName profile.lastName profile.email')
      .populate('createdBy', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    // Apply pagination only if limit is specified
    if (limit) {
      petQuery = petQuery.skip(skip).limit(limit);
    }

    const pets = await petQuery;

    return res.status(200).json({
      success: true,
      data: pets,
      pagination: {
        page: limit ? page : 1,
        limit: limit || total,
        total,
        totalPages: limit ? Math.ceil(total / limit) : 1
      }
    });
  } catch (error) {
    console.error('Get pets error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching pets'
    });
  }
};


// @desc    Get pet by ID
// @route   GET /api/pets/:id
// @access  Private
exports.getPetById = async (req, res) => {
  try {
    const businessIds = getAllBusinessIds(req.user);
    const userId = getUserId(req.user);
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    const pet = await Pet.findById(req.params.id)
      .populate('owner', 'profile email phone')
      .populate('createdBy', 'profile')
      .populate('medicalHistory.records.veterinarian', 'profile')
      .populate('medicalHistory.records.createdBy', 'profile');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if user has access to this pet
    const hasAccess = 
      (pet.business && businessIds.includes(pet.business.toString())) || 
      (pet.createdBy && pet.createdBy.toString() === userId) ||
      (pet.profile?.createdBy && pet.profile.createdBy.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this pet'
      });
    }

    res.status(200).json({
      success: true,
      data: pet
    });
  } catch (error) {
    console.error('Get pet by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pet'
    });
  }
};

// @desc    Create new pet
// @route   POST /api/pets
// @access  Private
exports.createPet = async (req, res) => {
  try {
    
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const businessIds = getAllBusinessIds(req.user);
    const userId =req.user.userId;
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    // Use the first business ID as the primary business (or let user specify)
    const primaryBusinessId = req.body.businessId;
    console.log( req.body.businessId)

    // Verify owner exists
    const owner = await User.findById(req.body.ownerId);
    if (!owner) {
      return res.status(404).json({
        success: false,
        message: 'Owner not found'
      });
    }

    const petData = {
      business: primaryBusinessId,
      owner: req.body.ownerId,
      profile: {
        ...req.body.profile,
        createdBy: userId
      },
      medicalHistory: req.body.medicalHistory || {
        allergies: [],
        medications: [],
        conditions: [],
        vaccinations: [],
        records: []
      },
      emergencyContact: req.body.emergencyContact || {},
      createdBy: userId
    };

    // Create the pet
    const pet = await Pet.create(petData);

    // Add pet ID to owner's pets array
    try {
      await User.findByIdAndUpdate(
        req.body.ownerId,
        { 
          $addToSet: { pets: pet._id } // $addToSet prevents duplicates
        },
        { new: true }
      );
      console.log(`Pet ${pet._id} added to owner ${req.body.ownerId}'s pets array`);
    } catch (updateError) {
      console.error('Error updating owner pets array:', updateError);
      // Don't fail the whole operation if this fails, just log it
    }

    // Populate the response
    await pet.populate([
      { path: 'owner', select: 'profile email' },
      { path: 'createdBy', select: 'profile' }
    ]);

    res.status(201).json({
      success: true,
      data: pet,
      message: 'Pet created successfully'
    });
  } catch (error) {
    console.error('Create pet error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Microchip ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while creating pet'
    });
  }
};

// Also update the deletePet function to remove pet ID from owner's pets array
exports.deletePet = async (req, res) => {
  try {
    const businessObjects = req.user.userData.business || [];
    const businessIds = businessObjects.map(business => 
      typeof business === 'object' && business._id 
        ? business._id.toString() 
        : business.toString()
    );
    const userId = req.user.userId;

    console.log(req.user.userData.business)
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }
    // Check if user has access to this pet
    const hasAccess = 
      (pet.business && businessIds.includes(pet.business.toString())) || 
      (pet.createdBy && pet.createdBy === userId);
      
      console.log(businessIds)

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this pet'
      });
    }

    // Store owner ID before deletion
    const ownerId = pet.owner;

    // Delete the pet
    await Pet.findByIdAndDelete(req.params.id);

    // Remove pet ID from owner's pets array
    try {
      await User.findByIdAndUpdate(
        ownerId,
        { 
          $pull: { pets: req.params.id } // $pull removes the pet ID
        },
        { new: true }
      );
      console.log(`Pet ${req.params.id} removed from owner ${ownerId}'s pets array`);
    } catch (updateError) {
      console.error('Error updating owner pets array after deletion:', updateError);
      // Don't fail the whole operation if this fails, just log it
    }

    res.status(200).json({
      success: true,
      message: 'Pet deleted successfully'
    });
  } catch (error) {
    console.error('Delete pet error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting pet'
    });
  }
};

// Also update the updatePet function to handle owner changes
exports.updatePet = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const businessIds = getAllBusinessIds(req.user);
    const userId = getUserId(req.user);
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if user has access to this pet
    const hasAccess = 
      (pet.business && businessIds.includes(pet.business.toString())) || 
      (pet.createdBy && pet.createdBy.toString() === userId) ||
      (pet.profile?.createdBy && pet.profile.createdBy.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pet'
      });
    }

    // Store old owner ID
    const oldOwnerId = pet.owner.toString();

    // Update fields
    const updateData = {
      profile: req.body.profile,
      medicalHistory: req.body.medicalHistory,
      emergencyContact: req.body.emergencyContact,
      updatedAt: new Date()
    };

    // Handle owner change
    if (req.body.ownerId && req.body.ownerId !== oldOwnerId) {
      const newOwner = await User.findById(req.body.ownerId);
      if (!newOwner) {
        return res.status(404).json({
          success: false,
          message: 'New owner not found'
        });
      }
      updateData.owner = req.body.ownerId;

      // Remove pet from old owner's pets array
      try {
        await User.findByIdAndUpdate(
          oldOwnerId,
          { $pull: { pets: req.params.id } },
          { new: true }
        );
        console.log(`Pet ${req.params.id} removed from old owner ${oldOwnerId}'s pets array`);
      } catch (updateError) {
        console.error('Error removing pet from old owner:', updateError);
      }

      // Add pet to new owner's pets array
      try {
        await User.findByIdAndUpdate(
          req.body.ownerId,
          { $addToSet: { pets: req.params.id } },
          { new: true }
        );
        console.log(`Pet ${req.params.id} added to new owner ${req.body.ownerId}'s pets array`);
      } catch (updateError) {
        console.error('Error adding pet to new owner:', updateError);
      }
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'owner', select: 'profile email' },
      { path: 'createdBy', select: 'profile' }
    ]);

    res.status(200).json({
      success: true,
      data: updatedPet,
      message: 'Pet updated successfully'
    });
  } catch (error) {
    console.error('Update pet error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Microchip ID already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while updating pet'
    });
  }
};


// @desc    Get pet statistics
// @route   GET /api/pets/stats
// @access  Private
exports.getPetStats = async (req, res) => {
  try {
    const businessIds = getAllBusinessIds(req.user);
    const userId = getUserId(req.user);
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    const matchQuery = {
      $or: [
        ...(businessIds.length > 0 ? [{ business: { $in: businessIds } }] : []),
        ...(userId ? [{ createdBy: userId }] : []),
        ...(userId ? [{ 'profile.createdBy': userId }] : [])
      ]
    };

    const stats = await Pet.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPets: { $sum: 1 },
          activePets: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          speciesCount: {
            $push: '$profile.species'
          }
        }
      }
    ]);

    const speciesStats = await Pet.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$profile.species',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: stats[0] || { totalPets: 0, activePets: 0 },
        speciesBreakdown: speciesStats
      }
    });
  } catch (error) {
    console.error('Get pet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching pet statistics'
    });
  }
};

// @desc    Search pets
// @route   GET /api/pets/search
// @access  Private
exports.searchPets = async (req, res) => {
  try {
    const businessIds = getAllBusinessIds(req.user);
    const userId = getUserId(req.user);
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    const { q, species, owner } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    let query = {
      $or: [
        ...(businessIds.length > 0 ? [{ business: { $in: businessIds } }] : []),
        ...(userId ? [{ createdBy: userId }] : []),
        ...(userId ? [{ 'profile.createdBy': userId }] : [])
      ],
      status: 'active'
    };

    // Build search conditions
    const searchConditions = [
      { 'profile.name': { $regex: q, $options: 'i' } },
      { 'profile.breed': { $regex: q, $options: 'i' } },
      { 'profile.microchipId': { $regex: q, $options: 'i' } }
    ];

    query.$and = query.$and || [];
    query.$and.push({ $or: searchConditions });

    // Add species filter if provided
    if (species && species !== 'all') {
      query['profile.species'] = species;
    }

    // Add owner filter if provided
    if (owner) {
      query.owner = owner;
    }

    const pets = await Pet.find(query)
      .populate('owner', 'profile email')
      .select('profile owner status lastVisit')
      .limit(20)
      .sort({ 'profile.name': 1 });

    res.status(200).json({
      success: true,
      data: pets,
      count: pets.length
    });
  } catch (error) {
    console.error('Search pets error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while searching pets'
    });
  }
};

// @desc    Add medical record
// @route   POST /api/pets/:id/medical-records
// @access  Private
exports.addMedicalRecord = async (req, res) => {
  try {
    const businessIds = getAllBusinessIds(req.user);
    const userId = getUserId(req.user);
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    const medicalRecord = {
      ...req.body,
      createdBy: userId
    };

    pet.medicalHistory.records.push(medicalRecord);
    pet.lastVisit = new Date();
    pet.totalVisits = (pet.totalVisits || 0) + 1;

    await pet.save();

    // Populate the updated pet
    await pet.populate([
      { path: 'owner', select: 'profile email' },
      { path: 'medicalHistory.records.veterinarian', select: 'profile' },
      { path: 'medicalHistory.records.createdBy', select: 'profile' }
    ]);

    res.status(201).json({
      success: true,
      data: pet,
      message: 'Medical record added successfully'
    });
  } catch (error) {
    console.error('Add medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding medical record'
    });
  }
};

// @desc    Get medical records
// @route   GET /api/pets/:id/medical-records
// @access  Private
exports.getMedicalRecords = async (req, res) => {
  try {
    const businessIds = getAllBusinessIds(req.user);
    const userId = getUserId(req.user);
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const pet = await Pet.findById(req.params.id)
      .populate('medicalHistory.records.veterinarian', 'profile')
      .populate('medicalHistory.records.createdBy', 'profile');

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if user has access to this pet
    const hasAccess = 
      (pet.business && businessIds.includes(pet.business.toString())) || 
      (pet.createdBy && pet.createdBy.toString() === userId) ||
      (pet.profile?.createdBy && pet.profile.createdBy.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this pet\'s medical records'
      });
    }

    // Sort records by date (newest first) and paginate
    const sortedRecords = (pet.medicalHistory.records || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(skip, skip + limit);

    const total = (pet.medicalHistory.records || []).length;

    res.status(200).json({
      success: true,
      data: {
        petId: pet._id,
        petName: pet.profile.name,
        records: sortedRecords,
        allergies: pet.medicalHistory.allergies || [],
        medications: pet.medicalHistory.medications || [],
        conditions: pet.medicalHistory.conditions || [],
        vaccinations: pet.medicalHistory.vaccinations || []
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get medical records error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching medical records'
    });
  }
};

// @desc    Update medical record
// @route   PUT /api/pets/:id/medical-records/:recordId
// @access  Private
exports.updateMedicalRecord = async (req, res) => {
  try {
    const businessIds = getAllBusinessIds(req.user);
    const userId = getUserId(req.user);
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if user has access to this pet
    const hasAccess = 
      (pet.business && businessIds.includes(pet.business.toString())) || 
      (pet.createdBy && pet.createdBy.toString() === userId) ||
      (pet.profile?.createdBy && pet.profile.createdBy.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this pet\'s medical records'
      });
    }

    const record = pet.medicalHistory.records.id(req.params.recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Update record fields
    Object.assign(record, req.body);
    record.updatedAt = new Date();

    await pet.save();

    // Populate the updated pet
    await pet.populate([
      { path: 'medicalHistory.records.veterinarian', select: 'profile' },
      { path: 'medicalHistory.records.createdBy', select: 'profile' }
    ]);

    res.status(200).json({
      success: true,
      data: record,
      message: 'Medical record updated successfully'
    });
  } catch (error) {
    console.error('Update medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating medical record'
    });
  }
};

// @desc    Delete medical record
// @route   DELETE /api/pets/:id/medical-records/:recordId
// @access  Private
exports.deleteMedicalRecord = async (req, res) => {
  try {
    const businessIds = getAllBusinessIds(req.user);
    const userId = getUserId(req.user);
    
    if (!businessIds.length && !userId) {
      return res.status(400).json({
        success: false,
        message: 'No business IDs or user ID found in user profile'
      });
    }

    const pet = await Pet.findById(req.params.id);

    if (!pet) {
      return res.status(404).json({
        success: false,
        message: 'Pet not found'
      });
    }

    // Check if user has access to this pet
    const hasAccess = 
      (pet.business && businessIds.includes(pet.business.toString())) || 
      (pet.createdBy && pet.createdBy.toString() === userId) ||
      (pet.profile?.createdBy && pet.profile.createdBy.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this pet\'s medical records'
      });
    }

    const record = pet.medicalHistory.records.id(req.params.recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found'
      });
    }

    // Remove record
    pet.medicalHistory.records.pull(req.params.recordId);
    await pet.save();

    res.status(200).json({
      success: true,
      message: 'Medical record deleted successfully'
    });
  } catch (error) {
    console.error('Delete medical record error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting medical record'
    });
  }
};

module.exports = exports;