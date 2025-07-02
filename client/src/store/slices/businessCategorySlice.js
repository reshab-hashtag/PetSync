// client/src/store/slices/businessCategorySlice.js (Updated with Axios API)
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { businessCategoryAPI } from '../../services/api';

// Async thunk for fetching active business categories
export const fetchActiveCategories = createAsyncThunk(
  'businessCategories/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const response = await businessCategoryAPI.getActive();
      
      if (response.data?.success) {
        return response.data.data;
      } else {
        console.error('Failed to fetch categories:', response.data?.message);
        // Return fallback categories if API fails
        return [
          { _id: 'default-1', name: 'Pet Grooming', slug: 'pet-grooming', color: '#3B82F6', icon: 'SparklesIcon' },
          { _id: 'default-2', name: 'Veterinary Clinic', slug: 'veterinary-clinic', color: '#10B981', icon: 'HeartIcon' },
          { _id: 'default-3', name: 'Pet Boarding', slug: 'pet-boarding', color: '#F59E0B', icon: 'HomeIcon' },
          { _id: 'default-4', name: 'Pet Training', slug: 'pet-training', color: '#8B5CF6', icon: 'AcademicCapIcon' }
        ];
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return fallback categories on network error
      return [
        { _id: 'default-1', name: 'Pet Grooming', slug: 'pet-grooming', color: '#3B82F6', icon: 'SparklesIcon' },
        { _id: 'default-2', name: 'Veterinary Clinic', slug: 'veterinary-clinic', color: '#10B981', icon: 'HeartIcon' },
        { _id: 'default-3', name: 'Pet Boarding', slug: 'pet-boarding', color: '#F59E0B', icon: 'HomeIcon' },
        { _id: 'default-4', name: 'Pet Training', slug: 'pet-training', color: '#8B5CF6', icon: 'AcademicCapIcon' }
      ];
    }
  }
);

// Async thunk for fetching all categories (admin)
export const fetchAllCategories = createAsyncThunk(
  'businessCategories/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await businessCategoryAPI.getAll(params);
      
      if (response.data?.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to fetch categories');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error occurred');
    }
  }
);

// Async thunk for creating a category
export const createCategory = createAsyncThunk(
  'businessCategories/create',
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await businessCategoryAPI.create(categoryData);
      
      if (response.data?.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to create category');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error occurred');
    }
  }
);

// Async thunk for updating a category
export const updateCategory = createAsyncThunk(
  'businessCategories/update',
  async ({ id, categoryData }, { rejectWithValue }) => {
    try {
      const response = await businessCategoryAPI.update(id, categoryData);
      
      if (response.data?.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to update category');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error occurred');
    }
  }
);

// Async thunk for deleting a category
export const deleteCategory = createAsyncThunk(
  'businessCategories/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await businessCategoryAPI.delete(id);
      
      if (response.data?.success) {
        return id;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to delete category');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error occurred');
    }
  }
);

// Async thunk for fetching category statistics
export const fetchCategoryStats = createAsyncThunk(
  'businessCategories/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await businessCategoryAPI.getStats();
      
      if (response.data?.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error occurred');
    }
  }
);

// Async thunk for fetching single category
export const fetchCategoryById = createAsyncThunk(
  'businessCategories/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await businessCategoryAPI.getById(id);
      
      if (response.data?.success) {
        return response.data.data;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to fetch category');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error occurred');
    }
  }
);

// Async thunk for updating display order
export const updateDisplayOrder = createAsyncThunk(
  'businessCategories/updateDisplayOrder',
  async (categories, { rejectWithValue }) => {
    try {
      const response = await businessCategoryAPI.updateDisplayOrder(categories);
      
      if (response.data?.success) {
        return categories;
      } else {
        return rejectWithValue(response.data?.message || 'Failed to update display order');
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Network error occurred');
    }
  }
);

const initialState = {
  // Active categories for dropdowns
  activeCategories: [],
  activeCategoriesLoading: false,
  activeCategoriesError: null,
  
  // All categories for admin management
  allCategories: [],
  allCategoriesLoading: false,
  allCategoriesError: null,
  pagination: {
    current: 1,
    total: 0,
    count: 0,
    totalRecords: 0
  },
  
  // Single category
  selectedCategory: null,
  selectedCategoryLoading: false,
  selectedCategoryError: null,
  
  // Category management states
  creating: false,
  updating: false,
  deleting: false,
  updatingOrder: false,
  
  // Category statistics
  stats: null,
  statsLoading: false,
  statsError: null
};

const businessCategorySlice = createSlice({
  name: 'businessCategories',
  initialState,
  reducers: {
    // Clear errors
    clearErrors: (state) => {
      state.activeCategoriesError = null;
      state.allCategoriesError = null;
      state.selectedCategoryError = null;
      state.statsError = null;
    },
    
    // Reset all categories state
    resetCategories: (state) => {
      state.allCategories = [];
      state.allCategoriesError = null;
      state.pagination = initialState.pagination;
    },
    
    // Set active categories manually (for testing or fallback)
    setActiveCategories: (state, action) => {
      state.activeCategories = action.payload;
    },
    
    // Clear selected category
    clearSelectedCategory: (state) => {
      state.selectedCategory = null;
      state.selectedCategoryError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Active Categories
      .addCase(fetchActiveCategories.pending, (state) => {
        state.activeCategoriesLoading = true;
        state.activeCategoriesError = null;
      })
      .addCase(fetchActiveCategories.fulfilled, (state, action) => {
        state.activeCategoriesLoading = false;
        state.activeCategories = action.payload;
        state.activeCategoriesError = null;
      })
      .addCase(fetchActiveCategories.rejected, (state, action) => {
        state.activeCategoriesLoading = false;
        state.activeCategoriesError = action.payload || 'Failed to fetch active categories';
        // Set fallback categories on error
        state.activeCategories = [
          { _id: 'default-1', name: 'Pet Grooming', slug: 'pet-grooming', color: '#3B82F6', icon: 'SparklesIcon' },
          { _id: 'default-2', name: 'Veterinary Clinic', slug: 'veterinary-clinic', color: '#10B981', icon: 'HeartIcon' },
          { _id: 'default-3', name: 'Pet Boarding', slug: 'pet-boarding', color: '#F59E0B', icon: 'HomeIcon' },
          { _id: 'default-4', name: 'Pet Training', slug: 'pet-training', color: '#8B5CF6', icon: 'AcademicCapIcon' }
        ];
      })
      
      // Fetch All Categories
      .addCase(fetchAllCategories.pending, (state) => {
        state.allCategoriesLoading = true;
        state.allCategoriesError = null;
      })
      .addCase(fetchAllCategories.fulfilled, (state, action) => {
        state.allCategoriesLoading = false;
        state.allCategories = action.payload.categories;
        state.pagination = action.payload.pagination;
        state.allCategoriesError = null;
      })
      .addCase(fetchAllCategories.rejected, (state, action) => {
        state.allCategoriesLoading = false;
        state.allCategoriesError = action.payload || 'Failed to fetch categories';
      })
      
      // Fetch Category By ID
      .addCase(fetchCategoryById.pending, (state) => {
        state.selectedCategoryLoading = true;
        state.selectedCategoryError = null;
      })
      .addCase(fetchCategoryById.fulfilled, (state, action) => {
        state.selectedCategoryLoading = false;
        state.selectedCategory = action.payload;
        state.selectedCategoryError = null;
      })
      .addCase(fetchCategoryById.rejected, (state, action) => {
        state.selectedCategoryLoading = false;
        state.selectedCategoryError = action.payload || 'Failed to fetch category';
      })
      
      // Create Category
      .addCase(createCategory.pending, (state) => {
        state.creating = true;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.creating = false;
        state.allCategories = [...state.allCategories, action.payload];
        // Also add to active categories if it's active
        if (action.payload.isActive) {
          state.activeCategories = [...state.activeCategories, action.payload];
        }
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.creating = false;
        state.allCategoriesError = action.payload || 'Failed to create category';
      })
      
      // Update Category
      .addCase(updateCategory.pending, (state) => {
        state.updating = true;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.updating = false;
        const updatedCategory = action.payload;
        
        // Update in all categories
        state.allCategories = state.allCategories.map(cat => 
          cat._id === updatedCategory._id ? updatedCategory : cat
        );
        
        // Update selected category if it's the same
        if (state.selectedCategory?._id === updatedCategory._id) {
          state.selectedCategory = updatedCategory;
        }
        
        // Update in active categories
        if (updatedCategory.isActive) {
          const existingIndex = state.activeCategories.findIndex(cat => cat._id === updatedCategory._id);
          if (existingIndex >= 0) {
            state.activeCategories[existingIndex] = updatedCategory;
          } else {
            state.activeCategories.push(updatedCategory);
          }
        } else {
          state.activeCategories = state.activeCategories.filter(cat => cat._id !== updatedCategory._id);
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.updating = false;
        state.allCategoriesError = action.payload || 'Failed to update category';
      })
      
      // Delete Category
      .addCase(deleteCategory.pending, (state) => {
        state.deleting = true;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.deleting = false;
        const deletedId = action.payload;
        
        // Remove from all categories
        state.allCategories = state.allCategories.filter(cat => cat._id !== deletedId);
        
        // Remove from active categories
        state.activeCategories = state.activeCategories.filter(cat => cat._id !== deletedId);
        
        // Clear selected category if it was deleted
        if (state.selectedCategory?._id === deletedId) {
          state.selectedCategory = null;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.deleting = false;
        state.allCategoriesError = action.payload || 'Failed to delete category';
      })
      
      // Update Display Order
      .addCase(updateDisplayOrder.pending, (state) => {
        state.updatingOrder = true;
      })
      .addCase(updateDisplayOrder.fulfilled, (state, action) => {
        state.updatingOrder = false;
        // Update display orders in state
        action.payload.forEach(({ id, displayOrder }) => {
          const category = state.allCategories.find(cat => cat._id === id);
          if (category) {
            category.displayOrder = displayOrder;
          }
        });
        // Sort categories by display order
        state.allCategories.sort((a, b) => a.displayOrder - b.displayOrder);
      })
      .addCase(updateDisplayOrder.rejected, (state, action) => {
        state.updatingOrder = false;
        state.allCategoriesError = action.payload || 'Failed to update display order';
      })
      
      // Fetch Category Stats
      .addCase(fetchCategoryStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchCategoryStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
        state.statsError = null;
      })
      .addCase(fetchCategoryStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload || 'Failed to fetch statistics';
      });
  }
});

export const { 
  clearErrors, 
  resetCategories, 
  setActiveCategories, 
  clearSelectedCategory 
} = businessCategorySlice.actions;

// Selectors
export const selectActiveCategories = (state) => state.businessCategories.activeCategories;
export const selectActiveCategoriesLoading = (state) => state.businessCategories.activeCategoriesLoading;
export const selectActiveCategoriesError = (state) => state.businessCategories.activeCategoriesError;

export const selectAllCategories = (state) => state.businessCategories.allCategories;
export const selectAllCategoriesLoading = (state) => state.businessCategories.allCategoriesLoading;
export const selectAllCategoriesError = (state) => state.businessCategories.allCategoriesError;
export const selectCategoriesPagination = (state) => state.businessCategories.pagination;

export const selectSelectedCategory = (state) => state.businessCategories.selectedCategory;
export const selectSelectedCategoryLoading = (state) => state.businessCategories.selectedCategoryLoading;
export const selectSelectedCategoryError = (state) => state.businessCategories.selectedCategoryError;

export const selectCategoryOperationLoading = (state) => ({
  creating: state.businessCategories.creating,
  updating: state.businessCategories.updating,
  deleting: state.businessCategories.deleting,
  updatingOrder: state.businessCategories.updatingOrder
});

export const selectCategoryStats = (state) => state.businessCategories.stats;
export const selectCategoryStatsLoading = (state) => state.businessCategories.statsLoading;
export const selectCategoryStatsError = (state) => state.businessCategories.statsError;

export default businessCategorySlice.reducer;