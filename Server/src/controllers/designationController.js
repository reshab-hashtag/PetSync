const Designation = require('../models/Designation');
const { ROLES } = require('../config/constants');

// Create designation (only business admin can create)
exports.createDesignation = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const { businessId } = req.params;
    
    // Check if user is business admin of this business
    if (req.user.role !== ROLES.BUSINESS_ADMIN || !req.user.business.includes(businessId)) {
      return res.status(403).json({ message: 'Not authorized to create designations for this business' });
    }
    
    // Check if designation already exists for this business
    const existingDesignation = await Designation.findOne({ 
      name: name.trim(), 
      business: businessId,
      isActive: true 
    });
    
    if (existingDesignation) {
      return res.status(400).json({ message: 'Designation already exists for this business' });
    }
    
    const designation = new Designation({
      name: name.trim(),
      description: description?.trim(),
      business: businessId,
      permissions,
      createdBy: req.user.id
    });
    
    await designation.save();
    
    res.status(201).json({
      message: 'Designation created successfully',
      designation
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all designations for a business
exports.getDesignations = async (req, res) => {
  try {
    const { businessId } = req.params;
    
    // Check if user has access to this business
    if (!req.user.business.includes(businessId)) {
      return res.status(403).json({ message: 'Not authorized to view designations for this business' });
    }
    
    const designations = await Designation.find({ 
      business: businessId, 
      isActive: true 
    }).populate('createdBy', 'profile.firstName profile.lastName');
    
    res.json({ designations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update designation
exports.updateDesignation = async (req, res) => {
  try {
    const { designationId } = req.params;
    const { name, description, permissions } = req.body;
    
    const designation = await Designation.findById(designationId);
    if (!designation) {
      return res.status(404).json({ message: 'Designation not found' });
    }
    
    // Check if user is business admin of this business
    if (req.user.role !== ROLES.BUSINESS_ADMIN || !req.user.business.includes(designation.business.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this designation' });
    }
    
    // Update fields
    if (name) designation.name = name.trim();
    if (description !== undefined) designation.description = description?.trim();
    if (permissions) designation.permissions = permissions;
    
    await designation.save();
    
    res.json({
      message: 'Designation updated successfully',
      designation
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete designation (soft delete)
exports.deleteDesignation = async (req, res) => {
  try {
    const { designationId } = req.params;
    
    const designation = await Designation.findById(designationId);
    if (!designation) {
      return res.status(404).json({ message: 'Designation not found' });
    }
    
    // Check if user is business admin of this business
    if (req.user.role !== ROLES.BUSINESS_ADMIN || !req.user.business.includes(designation.business.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this designation' });
    }
    
    // Check if any staff members are using this designation
    const User = require('../models/User');
    const staffCount = await User.countDocuments({ 
      designation: designationId, 
      isActive: true 
    });
    
    if (staffCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete designation. ${staffCount} staff member(s) are currently assigned to this designation.` 
      });
    }
    
    designation.isActive = false;
    await designation.save();
    
    res.json({ message: 'Designation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
