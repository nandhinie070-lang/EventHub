import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/events', { params });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch events.'
      );
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/events/${id}`);
      return response.data.event;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load event details.'
      );
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData, { rejectWithValue }) => {
    try {
      const response = await api.post('/events', eventData);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to submit event.'
      );
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/events/${id}`, data);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to update event.'
      );
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/events/${id}`);
      return { id, message: response.data.message };
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to delete event.'
      );
    }
  }
);

export const approveHod = createAsyncThunk(
  'events/approveHod',
  async ({ id, action, remarks }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/events/${id}/approve-hod`, {
        action,
        remarks
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'HOD review submission failed.'
      );
    }
  }
);

export const approvePrincipal = createAsyncThunk(
  'events/approvePrincipal',
  async ({ id, action, remarks }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/events/${id}/approve-principal`, {
        action,
        remarks
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Principal review submission failed.'
      );
    }
  }
);

export const fetchPendingApprovals = createAsyncThunk(
  'events/fetchPendingApprovals',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/events/pending-approvals');
      return response.data.events;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch pending approvals.'
      );
    }
  }
);

const initialState = {
  events: [],
  currentEvent: null,
  pendingApprovals: [],
  total: 0,
  page: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  successMessage: null
};

const eventSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    clearEventMessages: (state) => {
      state.error = null;
      state.successMessage = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Events
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.events;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Event By ID
      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create Event
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
        state.events.unshift(action.payload.event);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update Event
      .addCase(updateEvent.fulfilled, (state, action) => {
        state.successMessage = action.payload.message;
        state.currentEvent = action.payload.event;
        const index = state.events.findIndex((e) => e._id === action.payload.event._id);
        if (index !== -1) {
          state.events[index] = action.payload.event;
        }
      })

      // Delete Event
      .addCase(deleteEvent.fulfilled, (state, action) => {
        state.events = state.events.filter((e) => e._id !== action.payload.id);
        state.successMessage = action.payload.message;
      })

      // HOD Approval
      .addCase(approveHod.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(approveHod.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
        state.currentEvent = action.payload.event;
        state.pendingApprovals = state.pendingApprovals.filter(
          (e) => e._id !== action.payload.event._id
        );
      })
      .addCase(approveHod.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Principal Approval
      .addCase(approvePrincipal.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(approvePrincipal.fulfilled, (state, action) => {
        state.isLoading = false;
        state.successMessage = action.payload.message;
        state.currentEvent = action.payload.event;
        state.pendingApprovals = state.pendingApprovals.filter(
          (e) => e._id !== action.payload.event._id
        );
      })
      .addCase(approvePrincipal.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Pending Approvals
      .addCase(fetchPendingApprovals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPendingApprovals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pendingApprovals = action.payload;
      })
      .addCase(fetchPendingApprovals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCurrentEvent, clearEventMessages } = eventSlice.actions;
export default eventSlice.reducer;
