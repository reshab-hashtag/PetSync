// Server/src/controllers/clientController.js
const User = require('../models/User');
const Business = require('../models/Business');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const { ROLES } = require('../config/constants');
const auditService = require('../services/auditService');

class ClientController {
  // Get all clients
  async getClients(req, res, next) {
    try {
      const { userId, role, businessId } = req.user;
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        status = 'all',
        businessId: filterBusinessId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Build query based on user role
      let query = { role: ROLES.CLIENT };
      
      // Role-based filtering
      if (role === ROLES.BUSINESS_ADMIN || role === ROLES.STAFF) {
        // Business admins and staff can only see their business clients
        const userBusinesses = await Business.find({ 
          $or: [
            { owner: userId },
            { staff: userId }
          ]
        }).select('_id');
        
        const businessIds = userBusinesses.map(b => b._id);
        query.business = { $in: businessIds };
      } else if (role === ROLES.CLIENT) {
        // Clients can only see themselves
        query._id = userId;
      }
      // Super admin can see all clients (no additional filter)

      // Additional filters
      if (search) {
        query.$or = [
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } },
          { 'profile.email': { $regex: search, $options: 'i' } },
          { 'profile.phone': { $regex: search, $options: 'i' } }
        ];
      }

      if (status !== 'all') {
        query.isActive = status === 'active';
      }

      if (filterBusinessId) {
        query.business = filterBusinessId;
      }

      // Calculate pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Execute query with aggregation to get stats
      const [clients, totalClients] = await Promise.all([
        User.find(query)
          .populate('business', 'profile.name businessName')
          .populate('pets', 'profile.name profile.species')
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .select('-auth.passwordHash')
          .lean(),
        User.countDocuments(query)
      ]);

      // Get appointment and invoice stats for each client
      const clientsWithStats = await Promise.all(
        clients.map(async (client) => {
          const [appointmentCount, totalSpent, lastAppointment] = await Promise.all([
            Appointment.countDocuments({ client: client._id }),
            Invoice.aggregate([
              { $match: { client: client._id, 'payment.status': 'paid' } },
              { $group: { _id: null, total: { $sum: '$totals.total' } } }
            ]),
            Appointment.findOne({ client: client._id })
              .sort({ 'schedule.date': -1 })
              .select('schedule.date')
          ]);

          return {
            ...client,
            totalAppointments: appointmentCount,
            totalSpent: totalSpent[0]?.total || 0,
            lastVisit: lastAppointment?.schedule?.date || null
          };
        })
      );

      // Calculate stats
      const stats = {
        total: totalClients,
        active: await User.countDocuments({ ...query, isActive: true }),
        inactive: await User.countDocuments({ ...query, isActive: false })
      };

      // Pagination info
      const pagination = {
        current: parseInt(page),
        pages: Math.ceil(totalClients / parseInt(limit)),
        total: totalClients,
        limit: parseInt(limit)
      };

      res.json({
        success: true,
        data: {
          clients: clientsWithStats,
          stats,
          pagination
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single client
  async getClient(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const client = await User.findById(id)
        .populate('business', 'profile.name businessName')
        .populate('pets')
        .select('-auth.passwordHash');

      if (!client || client.role !== ROLES.CLIENT) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Check access permissions
      if (role === ROLES.CLIENT && client._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (role === ROLES.BUSINESS_ADMIN || role === ROLES.STAFF) {
        const hasAccess = client.business.some(bizId => 
          req.user.businessId === bizId.toString()
        );
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Get additional client statistics
      const [appointmentCount, totalSpent, recentAppointments] = await Promise.all([
        Appointment.countDocuments({ client: id }),
        Invoice.aggregate([
          { $match: { client: client._id, 'payment.status': 'paid' } },
          { $group: { _id: null, total: { $sum: '$totals.total' } } }
        ]),
        Appointment.find({ client: id })
          .sort({ 'schedule.date': -1 })
          .limit(5)
          .populate('business', 'profile.name')
          .populate('pet', 'profile.name')
      ]);

      const clientWithStats = {
        ...client.toObject(),
        totalAppointments: appointmentCount,
        totalSpent: totalSpent[0]?.total || 0,
        recentAppointments
      };

      res.json({
        success: true,
        data: { client: clientWithStats }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new client
  async createClient(req, res, next) {
    try {
      const { userId, role, businessId } = req.user;
      const { 
        profile, 
        businessId: assignedBusinessId, 
        password = 'TempPassword123!',
        settings = {},
        pets = []
      } = req.body;

      // Only business admins and super admins can create clients
      if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if client already exists
      const existingClient = await User.findOne({ 
        'profile.email': profile.email.toLowerCase() 
      });

      if (existingClient) {
        return res.status(400).json({
          success: false,
          message: 'Client with this email already exists'
        });
      }

      // Determine which business to assign client to
      let targetBusinessId = assignedBusinessId;
      
      if (role === ROLES.BUSINESS_ADMIN) {
        // Business admin can only assign to their own business
        if (assignedBusinessId && assignedBusinessId !== businessId) {
          // Verify the business admin owns the assigned business
          const business = await Business.findById(assignedBusinessId);
          if (!business || business.owner.toString() !== userId) {
            return res.status(403).json({
              success: false,
              message: 'You can only assign clients to businesses you own'
            });
          }
        } else {
          // Default to the business admin's business
          targetBusinessId = businessId;
        }
      } else if (role === ROLES.SUPER_ADMIN) {
        // Super admin can assign to any business
        if (assignedBusinessId) {
          const business = await Business.findById(assignedBusinessId);
          if (!business) {
            return res.status(404).json({
              success: false,
              message: 'Assigned business not found'
            });
          }
          targetBusinessId = assignedBusinessId;
        }
      }

      // Create client with business assignment
      const clientData = {
        role: ROLES.CLIENT,
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email.toLowerCase(),
          phone: profile.phone,
          avatar: profile.avatar || null,
          address: {
            street: profile.address?.street || '',
            city: profile.address?.city || '',
            state: profile.address?.state || '',
            zipCode: profile.address?.zipCode || '',
            country: profile.address?.country || 'India'
          }
        },
        auth: {
          passwordHash: password,
          emailVerified: false,
          phoneVerified: false,
          twoFactorEnabled: false
        },
        settings: {
          timezone: settings.timezone || 'GMT+5:30',
          notifications: {
            email: settings.notifications?.email !== false,
            sms: settings.notifications?.sms || false,
            push: settings.notifications?.push !== false
          },
          language: settings.language || 'en'
        },
        pets: [], 
        isActive: true
      };

      // Add business assignment if specified
      if (targetBusinessId) {
        clientData.business = [targetBusinessId];
      }

      const client = new User(clientData);
      await client.save();

      // If pets data is provided, create pet records
      if (pets && pets.length > 0) {
        const Pet = require('../models/Pet');
        const createdPets = [];
        
        for (const petData of pets) {
          const pet = new Pet({
            owner: client._id,
            business: targetBusinessId ? [targetBusinessId] : [],
            profile: {
              name: petData.name,
              species: petData.species,
              breed: petData.breed || '',
              gender: petData.gender || 'unknown',
              dateOfBirth: petData.dateOfBirth || null,
              color: petData.color || '',
              weight: petData.weight || null,
              microchipId: petData.microchipId || '',
              profilePicture: petData.profilePicture || null
            },
            medical: {
              allergies: petData.allergies || [],
              medications: petData.medications || [],
              conditions: petData.conditions || [],
              vaccinations: petData.vaccinations || [],
              vetInfo: petData.vetInfo || {}
            },
            behavioral: {
              temperament: petData.temperament || 'friendly',
              specialNeeds: petData.specialNeeds || [],
              notes: petData.behavioralNotes || ''
            }
          });
          
          await pet.save();
          createdPets.push(pet._id);
        }
        
        // Update client with pet references
        client.pets = createdPets;
        await client.save();
      }

      // Remove password from response
      const responseData = client.toObject();
      delete responseData.auth.passwordHash;

      // Populate business and pets for response
      await client.populate([
        { path: 'business', select: 'profile.name businessName' },
        { path: 'pets', select: 'profile.name profile.species' }
      ]);

      // Log action
      await auditService.log({
        user: userId,
        business: targetBusinessId,
        action: 'CREATE',
        resource: 'client',
        resourceId: client._id,
        details: {
          after: responseData,
          assignedBusiness: targetBusinessId,
          petsCount: pets?.length || 0
        }
      });

      res.status(201).json({
        success: true,
        message: 'Client created successfully',
        data: { 
          client: {
            ...responseData,
            business: client.business,
            pets: client.pets
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update client
  async updateClient(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;
      const updates = req.body;

      const client = await User.findById(id);
      if (!client || client.role !== ROLES.CLIENT) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Check permissions
      if (role === ROLES.CLIENT && client._id.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      if (role === ROLES.BUSINESS_ADMIN || role === ROLES.STAFF) {
        const hasAccess = client.business.some(bizId => 
          req.user.businessId === bizId.toString()
        );
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }

      // Store original data for audit
      const originalData = client.toObject();

      // Update client
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'auth') {
          client[key] = updates[key];
        }
      });

      await client.save();

      // Remove password from response
      const clientData = client.toObject();
      delete clientData.auth.passwordHash;

      // Log action
      await auditService.log({
        user: userId,
        action: 'UPDATE',
        resource: 'client',
        resourceId: client._id,
        details: {
          before: originalData,
          after: clientData
        }
      });

      res.json({
        success: true,
        message: 'Client updated successfully',
        data: { client: clientData }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete client
  async deleteClient(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      // Only business admins and super admins can delete clients
      if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const client = await User.findById(id);
      if (!client || client.role !== ROLES.CLIENT) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      // Check if client has appointments
      const hasAppointments = await Appointment.exists({ client: id });
      if (hasAppointments) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete client with existing appointments'
        });
      }

      await User.findByIdAndDelete(id);

      // Log action
      await auditService.log({
        user: userId,
        action: 'DELETE',
        resource: 'client',
        resourceId: id,
        details: {
          before: client.toObject()
        }
      });

      res.json({
        success: true,
        message: 'Client deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle client status
  async toggleClientStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;
      const { isActive } = req.body;

      // Only business admins and super admins can change status
      if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const client = await User.findById(id);
      if (!client || client.role !== ROLES.CLIENT) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }

      client.isActive = isActive;
      await client.save();

      // Remove password from response
      const clientData = client.toObject();
      delete clientData.auth.passwordHash;

      // Log action
      await auditService.log({
        user: userId,
        action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
        resource: 'client',
        resourceId: client._id
      });

      res.json({
        success: true,
        message: `Client ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { client: clientData }
      });
    } catch (error) {
      next(error);
    }
  }

  // Add client to business
  async addClientToBusiness(req, res, next) {
    try {
      const { businessId } = req.params;
      const { userId, role } = req.user;
      const { profile, password = 'TempPassword123!' } = req.body;

      // Only business admins and super admins can add clients to business
      if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Verify business exists and user has access
      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      if (role === ROLES.BUSINESS_ADMIN && business.owner.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if client already exists
      let client = await User.findOne({ 
        'profile.email': profile.email.toLowerCase() 
      });

      if (client) {
        // Add business to existing client
        if (!client.business.includes(businessId)) {
          client.business.push(businessId);
          await client.save();
        }
      } else {
        // Create new client
        client = new User({
          role: ROLES.CLIENT,
          business: [businessId],
          profile: {
            ...profile,
            email: profile.email.toLowerCase()
          },
          auth: {
            passwordHash: password,
            emailVerified: false
          }
        });

        await client.save();
      }

      // Remove password from response
      const clientData = client.toObject();
      delete clientData.auth.passwordHash;

      // Log action
      await auditService.log({
        user: userId,
        business: businessId,
        action: 'ADD_CLIENT',
        resource: 'business',
        resourceId: businessId,
        details: {
          clientId: client._id,
          clientEmail: client.profile.email
        }
      });

      res.status(201).json({
        success: true,
        message: 'Client added to business successfully',
        data: { client: clientData }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientController();