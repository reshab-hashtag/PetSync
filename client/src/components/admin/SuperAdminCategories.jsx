// client/src/pages/admin/SuperAdminCategories.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import BusinessCategoryManagement from '../../components/admin/BusinessCategoryManagement';
import RoleBasedAccess from '../../components/common/RoleBasedAccess';

const SuperAdminCategories = () => {
  const { user } = useSelector((state) => state.auth);

  // Redirect if not super admin
  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <RoleBasedAccess 
      allowedRoles={['super_admin']}
      fallback={<Navigate to="/dashboard" replace />}
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BusinessCategoryManagement />
        </div>
      </div>
    </RoleBasedAccess>
  );
};

export default SuperAdminCategories;