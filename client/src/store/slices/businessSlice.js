// client/src/store/slices/businessSlice.js
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
      const response = await api.get(`/admin/businesses/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch business details');
    }
  }
);

export const updateBusiness = createAsyncThunk(
  'business/updateBusiness',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/admin/businesses/${id}`, data);
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
export const selectBusinessError = (state) => state.business.error;