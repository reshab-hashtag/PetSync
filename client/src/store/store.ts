import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import staffReducer from './slices/staffSlice';
import businessReducer from './slices/businessSlice';
import clientReducer from './slices/clientSlice';
import businessCategoryReducer from './slices/businessCategorySlice';
import appointmentReducer from './slices/appointmentSlice';
import petsReducer from './slices/petSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    staff: staffReducer,
    business: businessReducer,
    businessCategories: businessCategoryReducer,
    appointments: appointmentReducer,
    pets: petsReducer,
    client: clientReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;