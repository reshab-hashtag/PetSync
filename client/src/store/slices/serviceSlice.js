// client/src/store/slices/serviceSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { serviceAPI } from '../../services/serviceAPI';
import toast from 'react-hot-toast';

// Async thunks
export const fetchServices = createAsyncThunk(
  'services/fetchServices',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await serviceAPI.getServices(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
    }
  }
);

export const fetchService = createAsyncThunk(
  'services/fetchService',
  async (serviceId, { rejectWithValue }) => {
    try {
      const response = await serviceAPI.getService(serviceId);
      return response.data.data.service;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service');
    }
  }
);

export const createService = createAsyncThunk(
  'services/createService',
  async (serviceData, { rejectWithValue }) => {
    try {
      const response = await serviceAPI.createService(serviceData);
      toast.success('Service created successfully');
      return response.data.data.service;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create service';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateService = createAsyncThunk(
  'services/updateService',
  async ({ serviceId, serviceData }, { rejectWithValue }) => {
    try {
      const response = await serviceAPI.updateService(serviceId, serviceData);
      toast.success('Service updated successfully');
      return response.data.data.service;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update service';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteService = createAsyncThunk(
  'services/deleteService',
  async (serviceId, { rejectWithValue }) => {
    try {
      await serviceAPI.deleteService(serviceId);
      toast.success('Service deleted successfully');
      return serviceId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete service';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const toggleServiceStatus = createAsyncThunk(
  'services/toggleServiceStatus',
  async ({ serviceId, isActive }, { rejectWithValue }) => {
    try {
      const response = await serviceAPI.toggleServiceStatus(serviceId, isActive);
      toast.success(`Service ${isActive ? 'activated' : 'deactivated'} successfully`);
      return response.data.data.service;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update service status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchServiceCategories = createAsyncThunk(
  'services/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceAPI.getServiceCategories();
      return response.data.data.categories;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const fetchServiceStats = createAsyncThunk(
  'services/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceAPI.getServiceStats();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service statistics');
    }
  }
);

const initialState = {
  services: [],
  currentService: null,
  categories: [],
  stats: {
    totalServices: 0,
    activeServices: 0,
    inactiveServices: 0,
    categoryStats: []
  },
  pagination: {
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  },
  filters: {
    search: '',
    category: 'all',
    isActive: undefined,
    page: 1,
    limit: 20
  },
  loading: {
    services: false,
    service: false,
    create: false,
    update: false,
    delete: false,
    categories: false,
    stats: false
  },
  error: null
};

const serviceSlice = createSlice({
  name: 'services',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearCurrentService: (state) => {
      state.currentService = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      const { type, loading } = action.payload;
      state.loading[type] = loading;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch services
      .addCase(fetchServices.pending, (state) => {
        state.loading.services = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading.services = false;
        state.services = action.payload.services;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading.services = false;
        state.error = action.payload;
      })

      // Fetch single service
      .addCase(fetchService.pending, (state) => {
        state.loading.service = true;
        state.error = null;
      })
      .addCase(fetchService.fulfilled, (state, action) => {
        state.loading.service = false;
        state.currentService = action.payload;
      })
      .addCase(fetchService.rejected, (state, action) => {
        state.loading.service = false;
        state.error = action.payload;
      })

      // Create service
      .addCase(createService.pending, (state) => {
        state.loading.create = true;
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.loading.create = false;
        state.services.unshift(action.payload);
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading.create = false;
        state.error = action.payload;
      })

      // Update service
      .addCase(updateService.pending, (state) => {
        state.loading.update = true;
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.loading.update = false;
        const index = state.services.findIndex(service => service._id === action.payload._id);
        if (index !== -1) {
          state.services[index] = action.payload;
        }
        if (state.currentService && state.currentService._id === action.payload._id) {
          state.currentService = action.payload;
        }
      })
      .addCase(updateService.rejected, (state, action) => {
        state.loading.update = false;
        state.error = action.payload;
      })

      // Delete service
      .addCase(deleteService.pending, (state) => {
        state.loading.delete = true;
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.loading.delete = false;
        state.services = state.services.filter(service => service._id !== action.payload);
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.loading.delete = false;
        state.error = action.payload;
      })

      // Toggle service status
      .addCase(toggleServiceStatus.fulfilled, (state, action) => {
        const index = state.services.findIndex(service => service._id === action.payload._id);
        if (index !== -1) {
          state.services[index] = action.payload;
        }
        if (state.currentService && state.currentService._id === action.payload._id) {
          state.currentService = action.payload;
        }
      })

      // Fetch categories
      .addCase(fetchServiceCategories.pending, (state) => {
        state.loading.categories = true;
      })
      .addCase(fetchServiceCategories.fulfilled, (state, action) => {
        state.loading.categories = false;
        state.categories = action.payload;
      })
      .addCase(fetchServiceCategories.rejected, (state, action) => {
        state.loading.categories = false;
        state.error = action.payload;
      })

      // Fetch stats
      .addCase(fetchServiceStats.pending, (state) => {
        state.loading.stats = true;
      })
      .addCase(fetchServiceStats.fulfilled, (state, action) => {
        state.loading.stats = false;
        state.stats = action.payload;
      })
      .addCase(fetchServiceStats.rejected, (state, action) => {
        state.loading.stats = false;
        state.error = action.payload;
      });
  }
});

export const { setFilters, clearFilters, clearCurrentService, clearError, setLoading } = serviceSlice.actions;

export default serviceSlice.reducer;