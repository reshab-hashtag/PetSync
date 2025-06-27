const AuditLog = require('../models/AuditLog');

class AuditService {
  // Log user action
  async log({ user, business, action, resource, resourceId, details = {}, metadata = {} }) {
    try {
      const auditLog = new AuditLog({
        user,
        business,
        action,
        resource,
        resourceId,
        details,
        metadata
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking main functionality
    }
  }

  // Get audit logs with filtering
  async getLogs({ userId, businessId, resource, action, dateFrom, dateTo, page = 1, limit = 50 }) {
    try {
      const filter = {};
      
      if (userId) filter.user = userId;
      if (businessId) filter.business = businessId;
      if (resource) filter.resource = resource;
      if (action) filter.action = action;
      
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;

      const logs = await AuditLog.find(filter)
        .populate('user', 'profile')
        .populate('business', 'profile.name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await AuditLog.countDocuments(filter);

      return {
        logs,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      };
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      throw error;
    }
  }
}

module.exports = new AuditService();