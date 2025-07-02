// client/src/store/slices/businessSlice.js - Enhanced version with createBusiness
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchBusinesses = createAsyncThunk(
  'business/fetchBusinesses',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`business/get?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch businesses');
    }
  }
);

export const fetchBusinessDetails = createAsyncThunk(
  'business/fetchBusinessDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/business/get/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch business details');
    }
  }
);

export const createBusiness = createAsyncThunk(
  'business/createBusiness',
  async (businessData, { rejectWithValue }) => {
    try {
      const response = await api.post('/business/register', businessData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create business');
    }
  }
);

export const updateBusiness = createAsyncThunk(
  'business/updateBusiness',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/business/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update business');
    }
  }
);

export const toggleBusinessStatus = createAsyncThunk(
  'business/toggleBusinessStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/admin/businesses/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update business status');
    }
  }
);

export const deleteBusiness = createAsyncThunk(
  'business/deleteBusiness',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/admin/businesses/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete business');
    }
  }
);



export const addStaffToBusiness = createAsyncThunk(
  'business/addStaffToBusiness',
  async ({ businessId, email, role }, { rejectWithValue }) => {
    console.log(businessId)
    try {
      const response = await api.post(`/business/add-staff/${businessId}`, {
        email,
        role
      });
      return { businessId, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add staff to business');
    }
  }
);


const initialState = {
  businesses: [],
  currentBusiness: null,
  pagination: {
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  },
  filters: {
    search: '',
    status: 'all',
    page: 1
  },
  loading: false,
  detailsLoading: false,
  createLoading: false,
  error: null
};

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentBusiness: (state) => {
      state.currentBusiness = null;
    },
    resetBusinessState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch businesses
      .addCase(fetchBusinesses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBusinesses.fulfilled, (state, action) => {
        state.loading = false;
        state.businesses = action.payload.businesses || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchBusinesses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch business details
      .addCase(fetchBusinessDetails.pending, (state) => {
        state.detailsLoading = true;
        state.error = null;
      })
      .addCase(fetchBusinessDetails.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.currentBusiness = action.payload.data.business;
      })
      .addCase(fetchBusinessDetails.rejected, (state, action) => {
        state.detailsLoading = false;
        state.error = action.payload;
      })

      // Create business
      .addCase(createBusiness.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createBusiness.fulfilled, (state, action) => {
        state.createLoading = false;
        // Add the new business to the beginning of the list if we're on the first page
        if (state.pagination.current === 1 && state.businesses.length < state.pagination.limit) {
          state.businesses.unshift(action.payload.data.business);
        }
        // Update pagination total
        state.pagination.total += 1;
      })
      .addCase(createBusiness.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })

      // Update business
      .addCase(updateBusiness.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBusiness.fulfilled, (state, action) => {
        state.loading = false;
        const updatedBusiness = action.payload.data.business;
        
        // Update in businesses array
        const index = state.businesses.findIndex(business => business._id === updatedBusiness._id);
        if (index !== -1) {
          state.businesses[index] = updatedBusiness;
        }
        
        // Update current business if it's the same
        if (state.currentBusiness && state.currentBusiness._id === updatedBusiness._id) {
          state.currentBusiness = updatedBusiness;
        }
      })
      .addCase(updateBusiness.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle business status
      .addCase(toggleBusinessStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleBusinessStatus.fulfilled, (state, action) => {
        // Status will be updated when fetchBusinesses is called again
      })
      .addCase(toggleBusinessStatus.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Delete business
      .addCase(deleteBusiness.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteBusiness.fulfilled, (state, action) => {
        // Remove from businesses array
        state.businesses = state.businesses.filter(business => business._id !== action.payload.id);
        
        // Update pagination total
        state.pagination.total = Math.max(0, state.pagination.total - 1);
        
        // Clear current business if it's the deleted one
        if (state.currentBusiness && state.currentBusiness._id === action.payload.id) {
          state.currentBusiness = null;
        }
      })
      .addCase(deleteBusiness.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  updateFilters, 
  clearCurrentBusiness, 
  resetBusinessState 
} = businessSlice.actions;

export default businessSlice.reducer;

// Selectors
export const selectBusinesses = (state) => state.business.businesses;
export const selectCurrentBusiness = (state) => state.business.currentBusiness;
export const selectBusinessPagination = (state) => state.business.pagination;
export const selectBusinessFilters = (state) => state.business.filters;
export const selectBusinessLoading = (state) => state.business.loading;
export const selectBusinessDetailsLoading = (state) => state.business.detailsLoading;
export const selectBusinessCreateLoading = (state) => state.business.createLoading;
export const selectBusinessError = (state) => state.business.error;