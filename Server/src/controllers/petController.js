const Pet = require('../models/Pet');
const User = require('../models/User');
const auditService = require('../services/auditService');

class PetController {
  // Create new pet
  async createPet(req, res, next) {
    try {
      const petData = req.body;
      
      // Set owner from authenticated user or provided ownerId
      const ownerId = petData.ownerId || req.user.userId;
      
      const pet = new Pet({
        ...petData,
        owner: ownerId
      });

      await pet.save();
      
      // Add pet to owner's pets array
      await User.findByIdAndUpdate(ownerId, {
        $push: { pets: pet._id }
      });

      // Log creation
      await auditService.log({
        user: req.user.userId,
        action: 'CREATE',
        resource: 'pet',
        resourceId: pet._id
      });

      res.status(201).json({
        success: true,
        message: 'Pet created successfully',
        data: { pet }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get pets
  async getPets(req, res, next) {
    try {
      const { ownerId, page = 1, limit = 20 } = req.query;
      
      const filter = {};
      if (ownerId) filter.owner = ownerId;
      
      const skip = (page - 1) * limit;

      const pets = await Pet.find(filter)
        .populate('owner', 'profile')
        .populate('documents')
        .sort({ 'profile.name': 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Pet.countDocuments(filter);

      res.json({
        success: true,
        data: {
          pets,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single pet
  async getPet(req, res, next) {
    try {
      const { id } = req.params;

      const pet = await Pet.findById(id)
        .populate('owner', 'profile')
        .populate('documents');

      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      res.json({
        success: true,
        data: { pet }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update pet
  async updatePet(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const pet = await Pet.findById(id);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      // Store original data for audit
      const originalData = pet.toObject();

      // Update pet
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          pet[key] = updates[key];
        }
      });

      await pet.save();

      // Log update
      await auditService.log({
        user: req.user.userId,
        action: 'UPDATE',
        resource: 'pet',
        resourceId: pet._id,
        details: {
          before: originalData,
          after: pet.toObject()
        }
      });

      res.json({
        success: true,
        message: 'Pet updated successfully',
        data: { pet }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete pet
  async deletePet(req, res, next) {
    try {
      const { id } = req.params;

      const pet = await Pet.findById(id);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      // Soft delete
      pet.isActive = false;
      await pet.save();

      // Remove from owner's pets array
      await User.findByIdAndUpdate(pet.owner, {
        $pull: { pets: pet._id }
      });

      // Log deletion
      await auditService.log({
        user: req.user.userId,
        action: 'DELETE',
        resource: 'pet',
        resourceId: pet._id
      });

      res.json({
        success: true,
        message: 'Pet deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Add medical record
  async addMedicalRecord(req, res, next) {
    try {
      const { id } = req.params;
      const { type, data } = req.body; // type: 'vaccination', 'medication', 'condition'

      const pet = await Pet.findById(id);
      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet not found'
        });
      }

      // Add medical record based on type
      switch (type) {
        case 'vaccination':
          pet.medical.vaccinations.push(data);
          break;
        case 'medication':
          pet.medical.medications.push(data);
          break;
        case 'condition':
          pet.medical.conditions.push(data);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid medical record type'
          });
      }

      await pet.save();

      res.json({
        success: true,
        message: 'Medical record added successfully',
        data: { pet }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get pet's appointment history
  async getPetAppointments(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const Appointment = require('../models/Appointment');
      
      const skip = (page - 1) * limit;

      const appointments = await Appointment.find({ pet: id })
        .populate('business', 'profile')
        .populate('staff.assigned', 'profile')
        .sort({ 'schedule.startTime': -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Appointment.countDocuments({ pet: id });

      res.json({
        success: true,
        data: {
          appointments,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PetController();