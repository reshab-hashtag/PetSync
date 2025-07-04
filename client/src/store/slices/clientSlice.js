// client/src/store/slices/clientSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { clientAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Async thunks
export const registerClient = createAsyncThunk(
  'client/register',
  async (clientData, { rejectWithValue }) => {
    try {
      const response = await clientAPI.registerClient(clientData);
      toast.success('Client registered successfully!');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to register client';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const getClients = createAsyncThunk(
  'client/getClients',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await clientAPI.getClients(params);
      console.log('getClients response:', response.data); // Debug log
      return response.data;
    } catch (error) {
      console.error('getClients error:', error); // Debug log
      const message = error.response?.data?.message || 'Failed to fetch clients';
      return rejectWithValue(message);
    }
  }
);

export const getClient = createAsyncThunk(
  'client/getClient',
  async (clientId, { rejectWithValue }) => {
    try {
      const response = await clientAPI.getClient(clientId);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to fetch client';
      return rejectWithValue(message);
    }
  }
);

export const updateClient = createAsyncThunk(
  'client/updateClient',
  async ({ clientId, clientData }, { rejectWithValue }) => {
    try {
      const response = await clientAPI.updateClient(clientId, clientData);
      toast.success('Client updated successfully!');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update client';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const deleteClient = createAsyncThunk(
  'client/deleteClient',
  async (clientId, { rejectWithValue }) => {
    try {
      await clientAPI.deleteClient(clientId);
      toast.success('Client deleted successfully!');
      return clientId;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete client';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

export const toggleClientStatus = createAsyncThunk(
  'client/toggleStatus',
  async (clientId, { rejectWithValue }) => {
    try {
      const response = await clientAPI.toggleClientStatus(clientId);
      toast.success('Client status updated successfully!');
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update client status';
      toast.error(message);
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  clients: [],
  currentClient: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  },
  filters: {
    search: '',
    status: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  isLoading: false,
  isRegistering: false,
  error: null
};

const clientSlice = createSlice({
  name: 'client',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentClient: (state) => {
      state.currentClient = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register Client
      .addCase(registerClient.pending, (state) => {
        state.isRegistering = true;
        state.error = null;
      })
      .addCase(registerClient.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.clients.unshift(action.payload);
        state.pagination.totalItems += 1;
      })
      .addCase(registerClient.rejected, (state, action) => {
        state.isRegistering = false;
        state.error = action.payload;
      })

      // Get Clients
      .addCase(getClients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getClients.fulfilled, (state, action) => {
        state.isLoading = false;
        // Handle different response structures
        if (action.payload && action.payload.users) {
          // If the response has a users property
          state.clients = Array.isArray(action.payload.users) ? action.payload.users : [];
          if (action.payload.pagination) {
            state.pagination = action.payload.pagination;
          }
        } else if (Array.isArray(action.payload)) {
          // If the response is directly an array
          state.clients = action.payload;
        } else if (action.payload && action.payload.data) {
          // If the response has a data property
          if (action.payload.data.users) {
            state.clients = Array.isArray(action.payload.data.users) ? action.payload.data.users : [];
            if (action.payload.data.pagination) {
              state.pagination = action.payload.data.pagination;
            }
          } else if (Array.isArray(action.payload.data)) {
            state.clients = action.payload.data;
          } else {
            state.clients = [];
          }
        } else {
          // Fallback
          state.clients = [];
        }
      })
      .addCase(getClients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.clients = []; // Ensure clients is always an array
      })

      // Get Single Client
      .addCase(getClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentClient = action.payload;
      })
      .addCase(getClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Client
      .addCase(updateClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.clients.findIndex(client => client._id === action.payload._id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.currentClient && state.currentClient._id === action.payload._id) {
          state.currentClient = action.payload;
        }
      })
      .addCase(updateClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Delete Client
      .addCase(deleteClient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteClient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.clients = state.clients.filter(client => client._id !== action.payload);
        state.pagination.totalItems -= 1;
        if (state.currentClient && state.currentClient._id === action.payload) {
          state.currentClient = null;
        }
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Toggle Client Status
      .addCase(toggleClientStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleClientStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.clients.findIndex(client => client._id === action.payload._id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        }
        if (state.currentClient && state.currentClient._id === action.payload._id) {
          state.currentClient = action.payload;
        }
      })
      .addCase(toggleClientStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearCurrentClient, setFilters, clearFilters } = clientSlice.actions;
export default clientSlice.reducer;