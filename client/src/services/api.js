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
    // ✅ Upload avatar
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/auth/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // ✅ Remove avatar
  removeAvatar: () => api.delete('/auth/profile/avatar'),
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


// Client API
export const clientAPI = {
  registerClient: (clientData) => api.post('/admin/users', clientData),
  getClients: (params) => api.get('/admin/users', { params: { ...params, role: 'client' } }),
  getClient: (id) => api.get(`/admin/users/${id}`),
  updateClient: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteClient: (id) => api.delete(`/admin/users/${id}`),
  toggleClientStatus: (id) => api.patch(`/admin/users/${id}/status`),
};



// public search API
export const publicSearchAPI = {
  // Search businesses by query and location
  searchBusinesses: (params) => api.get('/public/search/businesses', { params }),
  
  // Get business categories for public display
  getCategories: () => api.get('/public/categories'),
  
  // Get business details by ID
  getBusinessDetails: (id) => api.get(`/public/businesses/${id}`),
  
  // Get businesses by category
  getBusinessesByCategory: (categoryId, params = {}) => 
    api.get(`/public/categories/${categoryId}/businesses`, { params }),
  
  // Submit contact form / inquiry
  submitInquiry: (data) => api.post('/public/inquiries', data),
  
  // Get nearby businesses
  getNearbyBusinesses: (params) => api.get('/public/businesses/nearby', { params }),
};



export const otpAPI = {
  // Send OTP for login
  sendLoginOTP: (email) => api.post('/otp/send-login-otp', { email }),
  
  // Verify login OTP
  verifyLoginOTP: (email, otp) => api.post('/otp/verify-login-otp', { email, otp }),
  
  // Send OTP for registration
  sendRegistrationOTP: (email, firstName, lastName) => 
    api.post('/otp/send-registration-otp', { email, firstName, lastName }),
  
  // Send OTP for password reset
  sendPasswordResetOTP: (email) => api.post('/otp/send-password-reset-otp', { email }),
  
  // Verify password reset OTP
  verifyPasswordResetOTP: (email, otp, newPassword) => 
    api.post('/otp/verify-password-reset-otp', { email, otp, newPassword }),
  
  // Resend OTP
  resendOTP: (email, type) => api.post('/otp/resend-otp', { email, type })
};

export default api;