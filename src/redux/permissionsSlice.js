import { createSlice } from '@reduxjs/toolkit';
import { savePermissions, getPermissions, clearPermissionsStorage } from './sessionStorageUtils';  // Import updated functions

const initialState = getPermissions() || {};  // Initialize permissions from cookies

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    // Set permissions and store them in cookies
    setPermissions: (_, action) => {
      savePermissions(action.payload);  // Save encrypted permissions in cookies
      return action.payload;  // Return the permissions to store in Redux
    },
    // Clear permissions from Redux and cookies
    clearPermissions: () => {
      clearPermissionsStorage();  // Remove permissions from cookies
      return {};  // Return an empty object to clear state in Redux
    },
  },
});

export const { setPermissions, clearPermissions } = permissionsSlice.actions;
export default permissionsSlice.reducer;
