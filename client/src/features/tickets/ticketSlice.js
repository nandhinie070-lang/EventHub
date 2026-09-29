import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const registerForEvent = createAsyncThunk(
  'tickets/registerForEvent',
  async (payload, { rejectWithValue }) => {
    try {
      const eventId = typeof payload === 'string' ? payload : payload.eventId;
      const body = typeof payload === 'object' ? payload : {};
      const response = await api.post(`/registrations/register/${eventId}`, body);
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Registration failed.'
      );
    }
  }
);

export const fetchMyTickets = createAsyncThunk(
  'tickets/fetchMyTickets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/registrations/my-tickets');
      return response.data.tickets;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to fetch tickets.'
      );
    }
  }
);

export const fetchTicketByCode = createAsyncThunk(
  'tickets/fetchTicketByCode',
  async (ticketCode, { rejectWithValue }) => {
    try {
      const response = await api.get(`/registrations/ticket/${ticketCode}`);
      return response.data.ticket;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to retrieve ticket.'
      );
    }
  }
);

export const fetchEventAttendees = createAsyncThunk(
  'tickets/fetchEventAttendees',
  async ({ eventId, search, checkedIn }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/registrations/event/${eventId}/attendees`, {
        params: { search, checkedIn }
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Failed to load attendee roster.'
      );
    }
  }
);

export const checkInAttendee = createAsyncThunk(
  'tickets/checkInAttendee',
  async ({ ticketCode, eventId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/registrations/check-in', {
        ticketCode,
        eventId
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data || { message: 'Check-in failed.' }
      );
    }
  }
);

const initialState = {
  myTickets: [],
  currentTicket: null,
  attendees: [],
  eventInfo: null,
  lastCheckIn: null,
  isLoading: false,
  error: null,
  successMessage: null
};

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearTicketMessages: (state) => {
      state.error = null;
      state.successMessage = null;
      state.lastCheckIn = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Register For Event
      .addCase(registerForEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerForEvent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTicket = action.payload.ticket;
        state.myTickets.unshift(action.payload.ticket);
        state.successMessage = action.payload.message;
      })
      .addCase(registerForEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch My Tickets
      .addCase(fetchMyTickets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyTickets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myTickets = action.payload;
      })
      .addCase(fetchMyTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch Ticket By Code
      .addCase(fetchTicketByCode.fulfilled, (state, action) => {
        state.currentTicket = action.payload;
      })

      // Fetch Event Attendees
      .addCase(fetchEventAttendees.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEventAttendees.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendees = action.payload.attendees;
        state.eventInfo = action.payload.event;
      })
      .addCase(fetchEventAttendees.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Check-in Attendee
      .addCase(checkInAttendee.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkInAttendee.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastCheckIn = {
          success: true,
          ...action.payload
        };
        state.successMessage = action.payload.message;

        // Update local attendee list status
        const idx = state.attendees.findIndex(
          (a) => a.ticketCode === action.payload.ticketCode
        );
        if (idx !== -1) {
          state.attendees[idx].checkedIn = true;
          state.attendees[idx].checkedInAt = action.payload.checkedInAt;
          state.attendees[idx].status = 'attended';
        }
      })
      .addCase(checkInAttendee.rejected, (state, action) => {
        state.isLoading = false;
        state.lastCheckIn = {
          success: false,
          ...action.payload
        };
        state.error = action.payload?.message || 'Check-in failed';
      });
  }
});

export const { clearTicketMessages } = ticketSlice.actions;
export default ticketSlice.reducer;
