// client/src/store/slices/staffSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchStaffMembers = createAsyncThunk(
  'staff/fetchStaffMembers',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== 'all') {
          params.append(key, filters[key]);
        }
      });

      const response = await api.get(`/staff?${params.toString()}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff members');
    }
  }
);

export const fetchStaffMember = createAsyncThunk(
  'staff/fetchStaffMember',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/staff/${id}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff member');
    }
  }
);

export const createStaffMember = createAsyncThunk(
  'staff/createStaffMember',
  async (staffData, { rejectWithValue }) => {
    try {
      const response = await api.post('/staff', staffData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create staff member');
    }
  }
);

export const updateStaffMember = createAsyncThunk(
  'staff/updateStaffMember', 
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/staff/${id}`, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update staff member');
    }
  }
);

export const toggleStaffStatus = createAsyncThunk(
  'staff/toggleStaffStatus',
  async ({ id, isActive }, { rejectWithValue }) => {
    console.log(id, isActive);
    try {
      const response = await api.patch(`/staff/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update staff status');
    }
  }
);

export const resetStaffPassword = createAsyncThunk(
  'staff/resetStaffPassword',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.post(`/staff/${id}/reset-password`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset password');
    }
  }
);

export const deleteStaffMember = createAsyncThunk(
  'staff/deleteStaffMember',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/staff/${id}`);
      return { id, ...response.data };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete staff member');
    }
  }
);

export const fetchStaffStats = createAsyncThunk(
  'staff/fetchStaffStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/staff/stats');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch staff statistics');
    }
  }
);

const initialState = {
  staffMembers: [],
  currentStaff: null,
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
    staff: 0,
    admins: 0
  },
  pagination: {
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  },
  filters: {
    search: '',
    status: 'all',
    role: 'all',
    page: 1
  },
  loading: false,
  error: null
};

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCurrentStaff: (state) => {
      state.currentStaff = null;
    },
    resetStaffState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch staff members
      .addCase(fetchStaffMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.staffMembers = action.payload.staff || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchStaffMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch single staff member
      .addCase(fetchStaffMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStaffMember.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStaff = action.payload.staff;
      })
      .addCase(fetchStaffMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create staff member
      .addCase(createStaffMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStaffMember.fulfilled, (state, action) => {
        state.loading = false;
        // Optionally add to staff members array if on current page
        if (state.staffMembers.length < state.pagination.limit) {
          state.staffMembers.unshift(action.payload.data.staff);
        }
        // Update stats
        state.stats.total += 1;
        state.stats.active += 1;
        if (action.payload.data.staff.role === 'staff') {
          state.stats.staff += 1;
        } else if (action.payload.data.staff.role === 'business_admin') {
          state.stats.admins += 1;
        }
      })
      .addCase(createStaffMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update staff member
      .addCase(updateStaffMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStaffMember.fulfilled, (state, action) => {
        state.loading = false;
        const updatedStaff = action.payload.staff;
        
        // Update in staff members array
        const index = state.staffMembers.findIndex(staff => staff._id === updatedStaff._id);
        if (index !== -1) {
          state.staffMembers[index] = updatedStaff;
        }
        
        // Update current staff if it's the same
        if (state.currentStaff && state.currentStaff._id === updatedStaff._id) {
          state.currentStaff = updatedStaff;
        }
      })
      .addCase(updateStaffMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle staff status
      .addCase(toggleStaffStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleStaffStatus.fulfilled, (state, action) => {
        // Status will be updated when fetchStaffMembers is called again
      })
      .addCase(toggleStaffStatus.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Reset staff password
      .addCase(resetStaffPassword.pending, (state) => {
        state.error = null;
      })
      .addCase(resetStaffPassword.fulfilled, (state, action) => {
        // Password reset success will be handled by the component
      })
      .addCase(resetStaffPassword.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Delete staff member
      .addCase(deleteStaffMember.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteStaffMember.fulfilled, (state, action) => {
        // Remove from staff members array
        state.staffMembers = state.staffMembers.filter(staff => staff._id !== action.payload.id);
        
        // Update stats
        state.stats.total = Math.max(0, state.stats.total - 1);
        state.stats.active = Math.max(0, state.stats.active - 1);
        
        // Clear current staff if it's the deleted one
        if (state.currentStaff && state.currentStaff._id === action.payload.id) {
          state.currentStaff = null;
        }
      })
      .addCase(deleteStaffMember.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Fetch staff stats
      .addCase(fetchStaffStats.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchStaffStats.fulfilled, (state, action) => {
        state.stats = action.payload.stats;
      })
      .addCase(fetchStaffStats.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  updateFilters, 
  clearCurrentStaff, 
  resetStaffState 
} = staffSlice.actions;

export default staffSlice.reducer;

// Selectors
export const selectStaffMembers = (state) => state.staff.staffMembers;
export const selectCurrentStaff = (state) => state.staff.currentStaff;
export const selectStaffStats = (state) => state.staff.stats;
export const selectStaffPagination = (state) => state.staff.pagination;
export const selectStaffFilters = (state) => state.staff.filters;
export const selectStaffLoading = (state) => state.staff.loading;
export const selectStaffError = (state) => state.staff.error;