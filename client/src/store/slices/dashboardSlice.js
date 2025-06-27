import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchData',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getOverview(params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch dashboard data';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchQuickStats = createAsyncThunk(
  'dashboard/fetchQuickStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getStats();
      return response.data.data;
    } catch (error) {
      return rejectWithValue('Failed to fetch stats');
    }
  }
);

export const fetchRecentActivity = createAsyncThunk(
  'dashboard/fetchRecentActivity',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await dashboardAPI.getRecentActivity(limit);
      return response.data.data.activities;
    } catch (error) {
      return rejectWithValue('Failed to fetch recent activity');
    }
  }
);

const initialState = {
  overview: null,
  quickStats: null,
  recentActivity: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardData: (state) => {
      state.overview = null;
      state.quickStats = null;
      state.recentActivity = [];
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data
      .addCase(fetchDashboardData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.overview = action.payload;
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch quick stats
      .addCase(fetchQuickStats.fulfilled, (state, action) => {
        state.quickStats = action.payload;
      })
      // Fetch recent activity
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.recentActivity = action.payload;
      });
  },
});

export const { clearDashboardData, clearError } = dashboardSlice.actions;
export default dashboardSlice.reducer;