import { configureStore } from '@reduxjs/toolkit';
import permissionsReducer from './permissionsSlice';

const store = configureStore({
  reducer: {
    permissions: permissionsReducer,
  },
});

export default store;
