// client/src/store/slices/appointmentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { appointmentAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const createAppointment = createAsyncThunk(
  'appointments/createAppointment',
  async (appointmentData, { rejectWithValue }) => {
    try {
      const response = await appointmentAPI.createAppointment(appointmentData);
      toast.success('Appointment created successfully!');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create appointment';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchAppointments = createAsyncThunk(
  'appointments/fetchAppointments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await appointmentAPI.getAppointments(params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch appointments';
      return rejectWithValue(message);
    }
  }
);

export const fetchAppointment = createAsyncThunk(
  'appointments/fetchAppointment',
  async (appointmentId, { rejectWithValue }) => {
    try {
      const response = await appointmentAPI.getAppointment(appointmentId);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch appointment';
      return rejectWithValue(message);
    }
  }
);

export const updateAppointment = createAsyncThunk(
  'appointments/updateAppointment',
  async ({ appointmentId, appointmentData }, { rejectWithValue }) => {
    try {
      const response = await appointmentAPI.updateAppointment(appointmentId, appointmentData);
      toast.success('Appointment updated successfully!');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update appointment';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const cancelAppointment = createAsyncThunk(
  'appointments/cancelAppointment',
  async ({ appointmentId, reason }, { rejectWithValue }) => {
    try {
      const response = await appointmentAPI.cancelAppointment(appointmentId, { reason });
      toast.success('Appointment cancelled successfully!');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel appointment';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const updateAppointmentStatus = createAsyncThunk(
  'appointments/updateAppointmentStatus',
  async ({ appointmentId, status, data = {} }, { rejectWithValue }) => {
    try {
      let response;
      switch (status) {
        case 'checkin':
          response = await appointmentAPI.checkinAppointment(appointmentId);
          break;
        case 'start':
          response = await appointmentAPI.startService(appointmentId);
          break;
        case 'complete':
          response = await appointmentAPI.completeService(appointmentId, data);
          break;
        default:
          throw new Error('Invalid status update');
      }
      
      toast.success(`Appointment ${status}ed successfully!`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || `Failed to ${status} appointment`;
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const fetchAppointmentStats = createAsyncThunk(
  'appointments/fetchAppointmentStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await appointmentAPI.getAppointmentStats(params);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch appointment statistics';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  appointments: [],
  currentAppointment: null,
  stats: {
    totalAppointments: 0,
    totalRevenue: 0,
    byStatus: {}
  },
  pagination: {
    current: 1,
    pages: 1,
    total: 0,
    limit: 20
  },
  filters: {
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
    clientId: '',
    staffId: ''
  },
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null
};

const appointmentSlice = createSlice({
  name: 'appointments',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAppointment: (state) => {
      state.currentAppointment = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    updateAppointmentInList: (state, action) => {
      const index = state.appointments.findIndex(apt => apt._id === action.payload._id);
      if (index !== -1) {
        state.appointments[index] = action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Appointment
      .addCase(createAppointment.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.isCreating = false;
        state.appointments.unshift(action.payload.appointment);
        state.stats.totalAppointments += 1;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // Fetch Appointments
      .addCase(fetchAppointments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.appointments = action.payload.appointments || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.appointments = [];
      })

      // Fetch Single Appointment
      .addCase(fetchAppointment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAppointment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAppointment = action.payload.appointment;
      })
      .addCase(fetchAppointment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Appointment
      .addCase(updateAppointment.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateAppointment.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.appointments.findIndex(apt => apt._id === action.payload.appointment._id);
        if (index !== -1) {
          state.appointments[index] = action.payload.appointment;
        }
        if (state.currentAppointment && state.currentAppointment._id === action.payload.appointment._id) {
          state.currentAppointment = action.payload.appointment;
        }
      })
      .addCase(updateAppointment.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Cancel Appointment
      .addCase(cancelAppointment.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(cancelAppointment.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.appointments.findIndex(apt => apt._id === action.payload.appointment._id);
        if (index !== -1) {
          state.appointments[index] = action.payload.appointment;
        }
        if (state.currentAppointment && state.currentAppointment._id === action.payload.appointment._id) {
          state.currentAppointment = action.payload.appointment;
        }
      })
      .addCase(cancelAppointment.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Update Appointment Status
      .addCase(updateAppointmentStatus.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.appointments.findIndex(apt => apt._id === action.payload.appointment._id);
        if (index !== -1) {
          state.appointments[index] = action.payload.appointment;
        }
        if (state.currentAppointment && state.currentAppointment._id === action.payload.appointment._id) {
          state.currentAppointment = action.payload.appointment;
        }
      })
      .addCase(updateAppointmentStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload;
      })

      // Fetch Appointment Stats
      .addCase(fetchAppointmentStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchAppointmentStats.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { 
  clearError, 
  clearCurrentAppointment, 
  setFilters, 
  clearFilters, 
  updateAppointmentInList 
} = appointmentSlice.actions;

export default appointmentSlice.reducer;

// Selectors
export const selectAppointments = (state) => state.appointments.appointments;
export const selectCurrentAppointment = (state) => state.appointments.currentAppointment;
export const selectAppointmentStats = (state) => state.appointments.stats;
export const selectAppointmentPagination = (state) => state.appointments.pagination;
export const selectAppointmentFilters = (state) => state.appointments.filters;
export const selectAppointmentLoading = (state) => state.appointments.isLoading;
export const selectAppointmentCreating = (state) => state.appointments.isCreating;
export const selectAppointmentUpdating = (state) => state.appointments.isUpdating;
export const selectAppointmentError = (state) => state.appointments.error;