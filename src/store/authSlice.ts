// In src/store/authSlice.ts

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  username: string;
  full_name: string;
  roles: string[];
  privileges: string[];
}

// --- NEW: Define an interface for our system settings ---
interface SystemSettings {
  session_timeout_minutes: number;
  // Add other settings here as needed
}

interface AuthState {
  token: string | null;
  user: User | null;
  settings: SystemSettings | null; // --- NEW: Add settings to the state ---
}

const initialState: AuthState = {
  token: localStorage.getItem('caljar-token'),
  user: JSON.parse(localStorage.getItem('caljar-user') || 'null'),
  settings: JSON.parse(localStorage.getItem('caljar-settings') || 'null'), // --- NEW: Load settings from localStorage ---
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ token: string; user: User }>) {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      localStorage.setItem('caljar-token', token);
      localStorage.setItem('caljar-user', JSON.stringify(user));
    },
    // --- NEW: A reducer to set the system settings ---
    setSettings(state, action: PayloadAction<SystemSettings>) {
        state.settings = action.payload;
        localStorage.setItem('caljar-settings', JSON.stringify(action.payload));
    },
    logOut(state) {
      state.token = null;
      state.user = null;
      state.settings = null; // --- NEW: Clear settings on logout ---
      localStorage.removeItem('caljar-token');
      localStorage.removeItem('caljar-user');
      localStorage.removeItem('caljar-settings'); // --- NEW: Remove settings from localStorage ---
    },
  },
});

export const { setCredentials, setSettings, logOut } = authSlice.actions;
export default authSlice.reducer;