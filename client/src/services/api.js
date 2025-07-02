import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.post('/auth/change-password', data),
};

export const dashboardAPI = {
  getOverview: (params) => api.get('/dashboard/overview', { params }),
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: (limit) => api.get('/dashboard/activity', { params: { limit } }),
  getAppointmentAnalytics: (params) => api.get('/dashboard/analytics/appointments', { params }),
  getFinancialAnalytics: (params) => api.get('/dashboard/analytics/financial', { params }),
};

export const appointmentAPI = {
  getAppointments: (params) => api.get('/appointments', { params }),
  createAppointment: (data) => api.post('/appointments', data),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data),
  deleteAppointment: (id) => api.delete(`/appointments/${id}`),
  getAppointment: (id) => api.get(`/appointments/${id}`),
};

export const petAPI = {
  getPets: (params) => api.get('/pets', { params }),
  createPet: (data) => api.post('/pets', data),
  updatePet: (id, data) => api.put(`/pets/${id}`, data),
  deletePet: (id) => api.delete(`/pets/${id}`),
  getPet: (id) => api.get(`/pets/${id}`),
};


export const businessCategoryAPI = {
  // Get all categories with pagination and filters (admin)
  getAll: (params = {}) => api.get('/business-categories', { params }),
  
  // Get active categories for dropdowns (public)
  getActive: () => api.get('/business-categories/active'),
  
  // Get single category by ID
  getById: (id) => api.get(`/business-categories/${id}`),
  
  // Create new category (super admin only)
  create: (categoryData) => api.post('/business-categories', categoryData),
  
  // Update existing category (super admin only)
  update: (id, categoryData) => api.put(`/business-categories/${id}`, categoryData),
  
  // Delete category (super admin only)
  delete: (id) => api.delete(`/business-categories/${id}`),
  
  // Get category statistics (super admin only)
  getStats: () => api.get('/business-categories/admin/stats'),
  
  // Bulk update display order (super admin only)
  updateDisplayOrder: (categories) => api.put('/business-categories/bulk/display-order', { categories }),
};

export default api;