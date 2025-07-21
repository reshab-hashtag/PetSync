import axios from 'axios';
// import CryptoJS from 'crypto-js';
export { serviceAPI } from './serviceAPI';


// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

// const SECRET = "sdlkhzlkjfhvlzjkhdlvjkzbx,nb#$@^@$%^!&!$y2s01dfnzadfbnsjhk~!#%!#%Y&!Q%$Y";

// // Define routes that should NOT be encrypted
// const UNENCRYPTED_ROUTES = [
//   '/auth/login',
//   '/auth/register',
//   '/otp/send-login-otp',
//   '/otp/verify-login-otp',
//   '/otp/send-registration-otp',
//   '/otp/send-password-reset-otp',
//   '/otp/verify-password-reset-otp',
//   '/otp/resend-otp',
//   '/health'
// ];

// // Helper function to check if route should be encrypted
// const shouldEncrypt = (url) => {
//   // Extract the path from the full URL
//   const path = url.replace(api.defaults.baseURL, '').split('?')[0];
//   return !UNENCRYPTED_ROUTES.some(route => path === route || path.startsWith(route));
// };

// // Helper functions
// function encryptPayload(data) {
//   return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET).toString();
// }

// function decryptPayload(cipher) {
//   const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
//   const json = bytes.toString(CryptoJS.enc.Utf8);
//   return JSON.parse(json);
// }

// // REQUEST interceptor: add token + encrypt body (conditionally)
// api.interceptors.request.use(
//   (config) => {
//     // 1) Attach auth header
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     // 2) Encrypt JSON body if present AND route should be encrypted
//     if (config.data && shouldEncrypt(config.url)) {
//       config.data = { cipher: encryptPayload(config.data) };
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // RESPONSE interceptor: decrypt or handle 401 (conditionally)
// api.interceptors.response.use(
//   (response) => {
//     // Decrypt payload if it's wrapped in { cipher: "..." } AND route should be encrypted
//     if (response.data?.cipher && shouldEncrypt(response.config.url)) {
//       response.data = decryptPayload(response.data.cipher);
//     }
//     return response;
//   },
//   (error) => {
//     // On Unauthorized, clear storage and redirect
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       localStorage.removeItem('user');
//       window.location.href = '/login';
//     }
//     return Promise.reject(error);
//   }
// );











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

// export const appointmentAPI = {
//   getAppointments: (params) => api.get('/appointments', { params }),
//   createAppointment: (data) => api.post('/appointments', data),
//   updateAppointment: (id, data) => api.put(`/appointments/${id}`, data),
//   deleteAppointment: (id) => api.delete(`/appointments/${id}`),
//   getAppointment: (id) => api.get(`/appointments/${id}`),
// };

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
  toggleClientStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`,  { isActive }),
};


// Appointment API
export const appointmentAPI = {
  // Create new appointment
  createAppointment: async (appointmentData) => {
    return await api.post('/appointments', appointmentData);
  },

  // Get appointments with filters
  getAppointments: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key] && params[key] !== 'all') {
        queryParams.append(key, params[key]);
      }
    });

    return await api.get(`/appointments?${queryParams.toString()}`);
  },

  // Get single appointment
  getAppointment: async (appointmentId) => {
    return await api.get(`/appointments/${appointmentId}`);
  },

  // Update appointment
  updateAppointment: async (appointmentId, appointmentData) => {
    return await api.put(`/appointments/${appointmentId}`, appointmentData);
  },

  // Cancel appointment
  cancelAppointment: async (appointmentId, data) => {
    return await api.post(`/appointments/${appointmentId}/cancel`, data);
  },

  // Check-in appointment
  checkinAppointment: async (appointmentId) => {
    return await api.post(`/appointments/${appointmentId}/checkin`);
  },

  // Start service
  startService: async (appointmentId) => {
    return await api.post(`/appointments/${appointmentId}/start`);
  },

  // Complete service
  completeService: async (appointmentId, data = {}) => {
    return await api.post(`/appointments/${appointmentId}/complete`, data);
  },

  // Get appointment statistics
  getAppointmentStats: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryParams.append(key, params[key]);
      }
    });

    return await api.get(`/appointments/stats/overview?${queryParams.toString()}`);
  },

  // Get appointments by date range
  getAppointmentsByDateRange: async (dateFrom, dateTo, businessId) => {
    return await api.get(`/appointments`, {
      params: { dateFrom, dateTo, businessId }
    });
  },

  // Get appointments by client
  getAppointmentsByClient: async (clientId, params = {}) => {
    return await api.get(`/appointments`, {
      params: { clientId, ...params }
    });
  },

  // Get appointments by staff
  getAppointmentsByStaff: async (staffId, params = {}) => {
    return await api.get(`/appointments`, {
      params: { staffId, ...params }
    });
  },

  // Get today's appointments
  getTodaysAppointments: async (businessId) => {
    const today = new Date().toISOString().split('T')[0];
    return await api.get(`/appointments`, {
      params: { 
        businessId, 
        date: today,
        status: 'scheduled,confirmed,in_progress'
      }
    });
  },

  // Get upcoming appointments
  getUpcomingAppointments: async (businessId, days = 7) => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return await api.get(`/appointments`, {
      params: {
        businessId,
        dateFrom: today.toISOString().split('T')[0],
        dateTo: futureDate.toISOString().split('T')[0],
        status: 'scheduled,confirmed'
      }
    });
  },

  // Reschedule appointment
  rescheduleAppointment: async (appointmentId, newDateTime) => {
    return await api.put(`/appointments/${appointmentId}`, {
      schedule: {
        date: newDateTime.date,
        startTime: newDateTime.startTime,
        endTime: newDateTime.endTime
      }
    });
  },

  // Add notes to appointment
  addAppointmentNotes: async (appointmentId, notes) => {
    return await api.put(`/appointments/${appointmentId}`, {
      details: { notes }
    });
  },

  // Update appointment service details
  updateAppointmentService: async (appointmentId, serviceData) => {
    return await api.put(`/appointments/${appointmentId}`, {
      service: serviceData
    });
  },

  // Get appointment history for a pet
  getPetAppointmentHistory: async (petId, params = {}) => {
    return await api.get(`/pets/${petId}/appointments`, { params });
  },

  // Get appointment analytics
  getAppointmentAnalytics: async (params = {}) => {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
      if (params[key]) {
        queryParams.append(key, params[key]);
      }
    });

    return await api.get(`/dashboard/analytics/appointments?${queryParams.toString()}`);
  }
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