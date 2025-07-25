const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { authenticate } = require('../middleware/auth');


// Get available users to chat with (based on appointments)
router.get('/available-users', authenticate, async (req, res) => {
  try {
    const currentUser = req.user;
    let availableUsers = [];

    console.log('Getting available users for:', currentUser.role, currentUser.userId);

    if (currentUser.role === 'staff' || currentUser.role === 'business_admin') {
      // Staff can chat with clients who have appointments with them
      const appointments = await Appointment.find({
        $or: [
          { "staff.assigned": currentUser.userId },
        ],
        status: { $in: ['scheduled', 'in_progress', 'completed'] }
      })
      .populate('client', '_id profile.firstName profile.lastName profile.avatar role')
      .populate('service', 'name')
      .sort({ date: -1 });

      console.log('Found appointments for staff:', appointments.length);

      // Get unique clients from appointments
      const clientIds = new Set();
      const clients = [];
      
      appointments.forEach(appointment => {
        if (appointment.client && !clientIds.has(appointment.client._id.toString())) {
          clientIds.add(appointment.client._id.toString());
          clients.push({
            ...appointment.client.toObject(),
            lastAppointment: appointment.date,
            appointmentStatus: appointment.status,
            appointmentId: appointment._id,
            serviceName: appointment.service?.name || 'Unknown Service'
          });
        }
      });

      availableUsers = clients;

    } else if (currentUser.role === 'client') {
      // Clients can chat with staff from their appointments
      const appointments = await Appointment.find({
        client: currentUser.userId,
        status: { $in: ['scheduled', 'in_progress', 'completed'] }
      })
      .populate({
        path: 'staff.assigned',
        select: '_id profile.firstName profile.lastName profile.avatar role fullName'
      })
      .populate('service', 'name')
      .sort({ date: -1 });

      console.log('Found appointments for client:', appointments.length);
      console.log('Appointments:', appointments.map(apt => ({
        id: apt._id,
        staff: apt.staff,
        service: apt.service?.name
      })));

      // Get unique staff from appointments
      const staffIds = new Set();
      const staff = [];
      
      appointments.forEach(appointment => {
        console.log("Processing appointment staff:", appointment.staff);
        
        // Check if staff.assigned exists and is not null
        if (appointment.staff && 
            appointment.staff.assigned && 
            !staffIds.has(appointment.staff.assigned._id.toString())) {
          
          const staffMember = appointment.staff.assigned;
          staffIds.add(staffMember._id.toString());
          
          staff.push({
            _id: staffMember._id,
            profile: staffMember.profile,
            fullName: staffMember.fullName,
            role: staffMember.role,
            lastAppointment: appointment.date,
            appointmentStatus: appointment.status,
            appointmentId: appointment._id,
            serviceName: appointment.service?.name || 'Unknown Service'
          });
        }
      });

      console.log('Processed staff members:', staff.length);
      availableUsers = staff;
    }

    console.log('Available users found:', availableUsers.length);

    const formattedUsers = availableUsers.map(user => {
      // Handle different name formats
      let displayName = 'Unknown User';
      
      if (user.fullName) {
        displayName = user.fullName;
      } else if (user.profile && user.profile.firstName) {
        displayName = `${user.profile.firstName} ${user.profile.lastName || ''}`.trim();
      }

      return {
        id: user._id,
        name: displayName,
        avatar: user.profile?.avatar || null,
        role: user.role,
        lastAppointment: user.lastAppointment,
        appointmentStatus: user.appointmentStatus,
        appointmentId: user.appointmentId,
        serviceName: user.serviceName,
        isOnline: false // Will be updated by frontend via socket
      };
    });

    console.log('Formatted users:', formattedUsers);

    res.json({
      success: true,
      data: formattedUsers
    });

  } catch (error) {
    console.error('Error fetching available users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available users'
    });
  }
});

// Get appointments for chat context
router.get('/appointments/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    let appointments = [];

    if (currentUser.role === 'staff' || currentUser.role === 'business_admin') {
      // Get appointments where current user is staff and target is client
      appointments = await Appointment.find({
        $or: [
          { staff: currentUser.userId, client: userId },
          { assignedTo: currentUser.userId, client: userId }
        ],
        status: { $in: ['scheduled', 'in_progress', 'completed'] }
      })
      .populate('client', 'profile.firstName profile.lastName')
      .populate('service', 'name')
      .sort({ date: -1 })
      .limit(10);

    } else if (currentUser.role === 'pet_owner') {
      // Get appointments where current user is client and target is staff
      appointments = await Appointment.find({
        client: currentUser.userId,
        $or: [
          { staff: userId },
          { assignedTo: userId }
        ],
        status: { $in: ['scheduled', 'in_progress', 'completed'] }
      })
      .populate('staff', 'profile.firstName profile.lastName')
      .populate('assignedTo', 'profile.firstName profile.lastName')
      .populate('service', 'name')
      .sort({ date: -1 })
      .limit(10);
    }

    const formattedAppointments = appointments.map(apt => ({
      id: apt._id,
      service: apt.service?.name || 'Unknown Service',
      date: apt.date,
      status: apt.status,
      duration: apt.duration,
      client: apt.client ? `${apt.client.profile.firstName} ${apt.client.profile.lastName}` : null,
      staff: apt.staff ? `${apt.staff.profile.firstName} ${apt.staff.profile.lastName}` : 
             apt.assignedTo ? `${apt.assignedTo.profile.firstName} ${apt.assignedTo.profile.lastName}` : null
    }));

    res.json({
      success: true,
      data: formattedAppointments
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
});

// Check if user can start chat with target user
router.post('/can-chat/:targetUserId', authenticate, async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const { appointmentId } = req.body;
    const currentUser = req.user;

    // Get target user
    const targetUser = await User.findById(targetUserId)
      .select('role isActive');

    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    let canChat = false;
    let appointment = null;

    // Check appointment-based permissions
    if (currentUser.role === 'staff' || currentUser.role === 'business_admin') {
      if (targetUser.role === 'pet_owner') {
        const query = {
          $or: [
            { staff: currentUser.userId, client: targetUserId },
            { assignedTo: currentUser.userId, client: targetUserId }
          ],
          status: { $in: ['scheduled', 'in_progress', 'completed'] }
        };

        if (appointmentId) {
          query._id = appointmentId;
        }

        appointment = await Appointment.findOne(query)
          .populate('service', 'name');
        canChat = !!appointment;
      }
    } else if (currentUser.role === 'pet_owner') {
      if (targetUser.role === 'staff' || targetUser.role === 'business_admin') {
        const query = {
          client: currentUser.userId,
          $or: [
            { staff: targetUserId },
            { assignedTo: targetUserId }
          ],
          status: { $in: ['scheduled', 'in_progress', 'completed'] }
        };

        if (appointmentId) {
          query._id = appointmentId;
        }

        appointment = await Appointment.findOne(query)
          .populate('service', 'name');
        canChat = !!appointment;
      }
    }

    res.json({
      success: true,
      data: {
        canChat,
        reason: canChat ? null : 'No shared appointments found',
        appointment: appointment ? {
          id: appointment._id,
          service: appointment.service?.name || 'Unknown Service',
          date: appointment.date,
          status: appointment.status
        } : null
      }
    });

  } catch (error) {
    console.error('Error checking chat permissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check chat permissions'
    });
  }
});

// Get chat room info (if needed for validation)
router.get('/room-info/:roomId', authenticate, async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUser = req.user;

    // Parse room ID to get participant IDs and appointment ID
    const roomParts = roomId.split('_');
    let participantIds, appointmentId;

    if (roomParts.includes('apt')) {
      const aptIndex = roomParts.indexOf('apt');
      participantIds = roomParts.slice(0, aptIndex);
      appointmentId = roomParts[aptIndex + 1];
    } else {
      participantIds = roomParts;
    }
    
    if (!participantIds.includes(currentUser.userId)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this chat room'
      });
    }

    // Get participant info
    const participants = await User.find({
      _id: { $in: participantIds }
    })
    .select('_id profile.firstName profile.lastName profile.avatar role');

    // Get appointment info if available
    let appointmentDetails = null;
    if (appointmentId) {
      const appointment = await Appointment.findById(appointmentId)
        .populate('service', 'name');
      
      if (appointment) {
        appointmentDetails = {
          id: appointment._id,
          service: appointment.service?.name || 'Unknown Service',
          date: appointment.date,
          status: appointment.status
        };
      }
    }

    const formattedParticipants = participants.map(user => ({
      id: user._id,
      name: `${user.profile.firstName} ${user.profile.lastName}`,
      avatar: user.profile.avatar || null,
      role: user.role
    }));

    res.json({
      success: true,
      data: {
        roomId,
        participants: formattedParticipants,
        appointmentDetails
      }
    });

  } catch (error) {
    console.error('Error getting room info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room info'
    });
  }
});

module.exports = router;