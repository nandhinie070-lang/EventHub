import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Retrieve initial auth state from localStorage
const storedToken = localStorage.getItem('eventhub_token') || null;
const storedUser = localStorage.getItem('eventhub_user')
  ? JSON.parse(localStorage.getItem('eventhub_user'))
  : null;

// Async Thunks
export const fetchCollegeConfig = createAsyncThunk(
  'auth/fetchCollegeConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/college-config');
      return response.data.college;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch college configuration'
      );
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', formData);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Registration failed. Please try again.'
      );
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'OTP verification failed. Please check the code.'
      );
    }
  }
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (email, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/resend-otp', { email });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to resend OTP.'
      );
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (err) {
      if (err.response?.data?.unverified) {
        return rejectWithValue({
          unverified: true,
          email: err.response.data.email,
          message: err.response.data.message,
          otpPreview: err.response.data.otpPreview
        });
      }
      return rejectWithValue(
        err.response?.data?.message || 'Invalid email or password.'
      );
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/auth/me');
      return response.data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch user profile'
      );
    }
  }
);

const initialState = {
  user: storedUser,
  token: storedToken,
  isAuthenticated: !!storedToken && !!storedUser,
  isLoading: false,
  error: null,
  successMessage: null,
  pendingEmail: localStorage.getItem('eventhub_pending_email') || null,
  otpPreview: null,
  collegeConfig: {
    name: 'Apex Institute of Technology',
    shortName: 'AIT',
    domain: 'apex.edu',
    departments: [
      'Computer Science & Engineering',
      'Information Technology',
      'Electronics & Communication Engineering',
      'Electrical & Electronics Engineering',
      'Mechanical Engineering',
      'Civil Engineering'
    ],
    years: ['1st Year', '2nd Year', '3rd Year', '4th Year']
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setPendingEmail: (state, action) => {
      state.pendingEmail = action.payload;
      if (action.payload) {
        localStorage.setItem('eventhub_pending_email', action.payload);
      } else {
        localStorage.removeItem('eventhub_pending_email');
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.pendingEmail = null;
      state.otpPreview = null;
      localStorage.removeItem('eventhub_token');
      localStorage.removeItem('eventhub_user');
      localStorage.removeItem('eventhub_pending_email');
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch College Config
      .addCase(fetchCollegeConfig.fulfilled, (state, action) => {
        state.collegeConfig = action.payload;
      })

      // Register User
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingEmail = action.payload.email;
        state.otpPreview = action.payload.otpPreview || null;
        state.successMessage = action.payload.message;
        localStorage.setItem('eventhub_pending_email', action.payload.email);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.pendingEmail = null;
        state.otpPreview = null;
        localStorage.setItem('eventhub_token', action.payload.token);
        localStorage.setItem('eventhub_user', JSON.stringify(action.payload.user));
        localStorage.removeItem('eventhub_pending_email');
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
        state.otpPreview = action.payload.otpPreview || null;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Login User
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('eventhub_token', action.payload.token);
        localStorage.setItem('eventhub_user', JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        if (typeof action.payload === 'object' && action.payload?.unverified) {
          state.pendingEmail = action.payload.email;
          state.otpPreview = action.payload.otpPreview || null;
          state.error = action.payload.message;
          localStorage.setItem('eventhub_pending_email', action.payload.email);
        } else {
          state.error = action.payload;
        }
      })

      // Fetch Current User
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        localStorage.setItem('eventhub_user', JSON.stringify(action.payload));
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('eventhub_token');
        localStorage.removeItem('eventhub_user');
      });
  }
});

export const { setPendingEmail, clearError, clearSuccessMessage, logout } =
  authSlice.actions;
export default authSlice.reducer;
