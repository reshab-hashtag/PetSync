// store/slices/petSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const getPets = createAsyncThunk(
  'pets/getPets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/pets');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pets');
    }
  }
);

export const getPetById = createAsyncThunk(
  'pets/getPetById',
  async (petId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/pets/${petId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pet');
    }
  }
);

export const createPet = createAsyncThunk(
  'pets/createPet',
  async (petData, { rejectWithValue }) => {
    try {
      const response = await api.post('/pets', petData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create pet');
    }
  }
);

export const updatePet = createAsyncThunk(
  'pets/updatePet',
  async ({ id, petData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/pets/${id}`, petData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update pet');
    }
  }
);

export const deletePet = createAsyncThunk(
  'pets/deletePet',
  async (petId, { rejectWithValue }) => {
    try {
      await api.delete(`/pets/${petId}`);
      return petId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete pet');
    }
  }
);

export const addMedicalRecord = createAsyncThunk(
  'pets/addMedicalRecord',
  async ({ petId, recordData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/pets/${petId}/medical-records`, recordData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add medical record');
    }
  }
);

const initialState = {
  pets: [],
  selectedPet: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    species: 'all',
    status: 'all'
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

const petSlice = createSlice({
  name: 'pets',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedPet: (state) => {
      state.selectedPet = null;
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Get pets
      .addCase(getPets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pets = action.payload.data || action.payload;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(getPets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Get pet by ID
      .addCase(getPetById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPetById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedPet = action.payload.data || action.payload;
      })
      .addCase(getPetById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create pet
      .addCase(createPet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pets.unshift(action.payload.data || action.payload);
      })
      .addCase(createPet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update pet
      .addCase(updatePet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePet.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedPet = action.payload.data || action.payload;
        const index = state.pets.findIndex(pet => pet._id === updatedPet._id);
        if (index !== -1) {
          state.pets[index] = updatedPet;
        }
        if (state.selectedPet && state.selectedPet._id === updatedPet._id) {
          state.selectedPet = updatedPet;
        }
      })
      .addCase(updatePet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Delete pet
      .addCase(deletePet.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deletePet.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pets = state.pets.filter(pet => pet._id !== action.payload);
        if (state.selectedPet && state.selectedPet._id === action.payload) {
          state.selectedPet = null;
        }
      })
      .addCase(deletePet.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Add medical record
      .addCase(addMedicalRecord.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addMedicalRecord.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedPet = action.payload.data || action.payload;
        const index = state.pets.findIndex(pet => pet._id === updatedPet._id);
        if (index !== -1) {
          state.pets[index] = updatedPet;
        }
        if (state.selectedPet && state.selectedPet._id === updatedPet._id) {
          state.selectedPet = updatedPet;
        }
      })
      .addCase(addMedicalRecord.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, setFilters, clearSelectedPet, setPagination } = petSlice.actions;
export default petSlice.reducer;