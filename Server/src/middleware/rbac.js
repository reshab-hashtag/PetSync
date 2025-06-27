const { ROLES } = require('../config/constants');

const authorize = (requiredPermissions = []) => {
  return (req, res, next) => {
    const { role, permissions } = req.user;

    // Super admin has all permissions
    if (role === ROLES.SUPER_ADMIN) {
      return next();
    }

    // Check if user has required permissions
    if (requiredPermissions.length > 0) {
      const hasPermission = requiredPermissions.every(required => {
        const [module, action] = required.split(':');
        const userPermission = permissions.find(p => p.module === module);
        return userPermission && userPermission.actions.includes(action);
      });

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          required: requiredPermissions
        });
      }
    }

    next();
  };
};

const checkBusinessAccess = (req, res, next) => {
  const { businessId, role } = req.user;
  const requestedBusinessId = req.params.businessId || req.body.businessId || req.query.businessId;

  if (role !== ROLES.SUPER_ADMIN && businessId && requestedBusinessId && businessId.toString() !== requestedBusinessId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied to this business'
    });
  }

  next();
};

const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient role privileges',
        required: allowedRoles,
        current: role
      });
    }

    next();
  };
};

module.exports = { authorize, checkBusinessAccess, requireRole };