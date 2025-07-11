import  api  from './api';

// Service API
export const serviceAPI = {
  // Get all services with filtering and pagination
  getServices: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    return await api.get(`/services?${queryParams.toString()}`);
  },

  // Get single service by ID
  getService: async (serviceId) => {
    return await api.get(`/services/${serviceId}`);
  },

  // Create new service
  createService: async (serviceData) => {
    return await api.post('/services', serviceData);
  },

  // Update existing service
  updateService: async (serviceId, serviceData) => {
    return await api.put(`/services/${serviceId}`, serviceData);
  },

  // Delete service
  deleteService: async (serviceId) => {
    return await api.delete(`/services/${serviceId}`);
  },

  // Toggle service status (activate/deactivate)
  toggleServiceStatus: async (serviceId, isActive) => {
    return await api.patch(`/services/${serviceId}/status`, { isActive });
  },

  // Get service categories
  getServiceCategories: async () => {
    return await api.get('/services/categories');
  },

  // Get service statistics
  getServiceStats: async () => {
    return await api.get('/services/stats');
  },

  // Bulk operations
  bulkUpdateServices: async (serviceIds, updates) => {
    return await api.patch('/services/bulk', { serviceIds, updates });
  },

  // Get services by category
  getServicesByCategory: async (category, params = {}) => {
    return await api.get('/services', { params: { ...params, category } });
  },

  // Get active services only
  getActiveServices: async (params = {}) => {
    return await api.get('/services', { params: { ...params, isActive: true } });
  },

  // Search services
  searchServices: async (searchTerm, params = {}) => {
    return await api.get('/services', { 
      params: { 
        ...params, 
        search: searchTerm 
      } 
    });
  }
};