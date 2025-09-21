import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// --- CORRECTED: Added 'export' to both lines below ---
// This makes these types available for other files to import.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;