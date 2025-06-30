// client/src/components/common/RoleBasedAccess.jsx
import React from 'react';
import { useSelector } from 'react-redux';

const RoleBasedAccess = ({ 
  allowedRoles = [], 
  children, 
  fallback = null,
  requireAll = false 
}) => {
  const { user } = useSelector((state) => state.auth);

  if (!user || !user.role) {
    return fallback;
  }

  const hasAccess = requireAll 
    ? allowedRoles.every(role => user.role === role)
    : allowedRoles.includes(user.role);

  return hasAccess ? children : fallback;
};

export default RoleBasedAccess;

// Usage examples:
// <RoleBasedAccess allowedRoles={['business_admin']}>
//   <StaffManagementButton />
// </RoleBasedAccess>

// <RoleBasedAccess 
//   allowedRoles={['business_admin', 'super_admin']} 
//   fallback={<div>Access Denied</div>}
// >
//   <AdminPanel />
// </RoleBasedAccess>