import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCurrentUser, fetchCollegeConfig } from './features/auth/authSlice';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardOverviewPage from './pages/dashboard/DashboardOverviewPage';
import EventsExplorePage from './pages/events/EventsExplorePage';
import EventDetailPage from './pages/events/EventDetailPage';
import CreateEventPage from './pages/events/CreateEventPage';
import ApprovalsPage from './pages/approvals/ApprovalsPage';
import MyTicketsPage from './pages/tickets/MyTicketsPage';
import CheckInScannerPage from './pages/scanner/CheckInScannerPage';
import FoodScannerPage from './pages/scanner/FoodScannerPage';
import AttendeesRosterPage from './pages/attendees/AttendeesRosterPage';
import CertificatesPage from './pages/certificates/CertificatesPage';
import VerifyCertificatePage from './pages/certificates/VerifyCertificatePage';
import AnalyticsReportsPage from './pages/reports/AnalyticsReportsPage';
import CoordinatorIssueBoardPage from './pages/issues/CoordinatorIssueBoardPage';
import StudentIssueTrackerPage from './pages/issues/StudentIssueTrackerPage';
import UserDirectoryPage from './pages/users/UserDirectoryPage';
import CollegeSettingsPage from './pages/admin/CollegeSettingsPage';
import EventTemplatesPage from './pages/admin/EventTemplatesPage';
import SystemLogsPage from './pages/admin/SystemLogsPage';
import ProtectedRoute from './components/routing/ProtectedRoute';
import { ToastProvider } from './components/common/Toast';

function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchCollegeConfig());
    if (token) {
      dispatch(fetchCurrentUser());
    }
  }, [dispatch, token]);

  return (
    <ToastProvider>
      <Routes>
        {/* Public Landing & Authentication */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Public Credential Verification */}
        <Route path="/verify-certificate" element={<VerifyCertificatePage />} />
        <Route path="/verify/:certificateId" element={<VerifyCertificatePage />} />

        {/* Protected Dashboard Shell Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardOverviewPage />} />

            {/* Events Management */}
            <Route path="/events" element={<EventsExplorePage />} />
            <Route path="/events/create" element={<CreateEventPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />

            {/* Multi-Tier Approvals (HOD, Principal, Admin) */}
            <Route
              path="/approvals"
              element={<ProtectedRoute allowedRoles={['hod', 'principal', 'admin']} />}
            >
              <Route index element={<ApprovalsPage />} />
            </Route>

            {/* Registrations & Digital Passes */}
            <Route path="/my-tickets" element={<MyTicketsPage />} />

            {/* Check-in Scanner & Gate Control (Organizer, Admin, Principal) */}
            <Route
              path="/scanner"
              element={<ProtectedRoute allowedRoles={['organizer', 'admin', 'principal']} />}
            >
              <Route index element={<CheckInScannerPage />} />
              <Route path="food" element={<FoodScannerPage />} />
            </Route>

            {/* Attendee Roster (Organizer, Admin, HOD, Principal) */}
            <Route
              path="/attendees"
              element={<ProtectedRoute allowedRoles={['organizer', 'admin', 'hod', 'principal']} />}
            >
              <Route index element={<AttendeesRosterPage />} />
            </Route>

            {/* Verifiable E-Certificates */}
            <Route path="/certificates" element={<CertificatesPage />} />

            {/* Incident & Issue Reporting with SLA */}
            <Route path="/issues/my" element={<StudentIssueTrackerPage />} />
            <Route
              path="/issues/board"
              element={<ProtectedRoute allowedRoles={['organizer', 'admin', 'hod', 'principal']} />}
            >
              <Route index element={<CoordinatorIssueBoardPage />} />
            </Route>

            {/* College Analytics & Reports (HOD, Principal, Admin, Organizer) */}
            <Route
              path="/reports"
              element={<ProtectedRoute allowedRoles={['hod', 'principal', 'admin', 'organizer']} />}
            >
              <Route index element={<AnalyticsReportsPage />} />
            </Route>

            {/* User Directory & Role Assignment (Admin) */}
            <Route
              path="/users"
              element={<ProtectedRoute allowedRoles={['admin']} />}
            >
              <Route index element={<UserDirectoryPage />} />
            </Route>

            {/* Dynamic Event Templates & Schema Builder (Admin) */}
            <Route
              path="/admin/templates"
              element={<ProtectedRoute allowedRoles={['admin']} />}
            >
              <Route index element={<EventTemplatesPage />} />
            </Route>

            {/* College Domain Settings (Admin) */}
            <Route
              path="/settings"
              element={<ProtectedRoute allowedRoles={['admin']} />}
            >
              <Route index element={<CollegeSettingsPage />} />
            </Route>

            {/* System Logs & Telemetry (Admin) */}
            <Route
              path="/logs"
              element={<ProtectedRoute allowedRoles={['admin']} />}
            >
              <Route index element={<SystemLogsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ToastProvider>
  );
}

export default App;
