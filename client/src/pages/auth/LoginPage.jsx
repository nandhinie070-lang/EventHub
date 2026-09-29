import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginUser, clearError } from '../../features/auth/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Navbar from '../../components/layout/Navbar';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isLoading, error, isAuthenticated, pendingEmail } = useSelector(
    (state) => state.auth
  );

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const resultAction = await dispatch(loginUser(formData));

    if (loginUser.rejected.match(resultAction)) {
      if (resultAction.payload?.unverified) {
        // Redirect to OTP verification screen if not verified
        navigate('/verify-otp');
      }
    }
  };

  // Helper to quickly fill demo accounts for testing
  const fillCredentials = (email, password) => {
    setFormData({ email, password });
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Glow ambient circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-indigo-500/15 blur-3xl pointer-events-none rounded-full -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          {/* Main Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-soft-lg border border-slate-200/80 dark:border-slate-800/80">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl gradient-brand mx-auto flex items-center justify-center text-white shadow-soft mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Welcome Back
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Log in to access your EventHub portal
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="you@apex.edu or external email"
                icon={Mail}
                required
                value={formData.email}
                onChange={handleChange}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                required
                value={formData.password}
                onChange={handleChange}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Sign In
                </Button>
              </div>
            </form>

            {/* Switch to Register */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Register here
                </Link>
              </p>
            </div>

            {/* Quick Demo Logins for evaluators */}
            <div className="mt-6 pt-4 border-t border-dashed border-slate-200 dark:border-slate-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center mb-2.5">
                Quick Demo Accounts (1-Click Fill)
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => fillCredentials('admin@apex.edu', 'Admin@123')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 text-left font-medium transition-colors"
                >
                  <span className="font-bold block text-[10px] text-rose-500">ADMIN</span>
                  admin@apex.edu
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('principal@apex.edu', 'Principal@123')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 text-left font-medium transition-colors"
                >
                  <span className="font-bold block text-[10px] text-amber-500">PRINCIPAL</span>
                  principal@apex.edu
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('hod.cse@apex.edu', 'Hod@123')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 text-left font-medium transition-colors"
                >
                  <span className="font-bold block text-[10px] text-blue-500">HOD (CSE)</span>
                  hod.cse@apex.edu
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('organizer@apex.edu', 'Organizer@123')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 text-left font-medium transition-colors"
                >
                  <span className="font-bold block text-[10px] text-purple-500">ORGANIZER</span>
                  organizer@apex.edu
                </button>
                <button
                  type="button"
                  onClick={() => fillCredentials('student@apex.edu', 'Student@123')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 text-left font-medium transition-colors col-span-2 sm:col-span-1"
                >
                  <span className="font-bold block text-[10px] text-emerald-500">STUDENT</span>
                  student@apex.edu
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
