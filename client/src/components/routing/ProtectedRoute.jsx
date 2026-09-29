import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import Button from '../common/Button';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated || !token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is authorized
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="py-12 flex items-center justify-center p-6 w-full">
        <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 mb-4">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Access Restricted
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
            Your role (<span className="font-semibold text-slate-800 dark:text-slate-200">{user.role}</span>) does not have permission to access this module.
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
