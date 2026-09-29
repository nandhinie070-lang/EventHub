import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User as UserIcon,
  Building,
  GraduationCap,
  Phone,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { registerUser, clearError, fetchCollegeConfig } from '../../features/auth/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Navbar from '../../components/layout/Navbar';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, error, collegeConfig } = useSelector(
    (state) => state.auth
  );

  const [userType, setUserType] = useState('internal'); // 'internal' | 'external'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    rollNo: '',
    department: 'Computer Science & Engineering',
    year: '1st Year',
    collegeName: '',
    phone: '',
    idCardUrl: ''
  });

  const [domainError, setDomainError] = useState('');

  useEffect(() => {
    dispatch(clearError());
    dispatch(fetchCollegeConfig());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Live validation for email domain if internal
    if (name === 'email' && userType === 'internal') {
      const parts = value.split('@');
      if (parts.length > 1 && parts[1].length > 0) {
        if (parts[1].toLowerCase() !== (collegeConfig?.domain || 'apex.edu').toLowerCase()) {
          setDomainError(`Official domain must be @${collegeConfig?.domain || 'apex.edu'}`);
        } else {
          setDomainError('');
        }
      } else {
        setDomainError('');
      }
    }
  };

  const handleUserTypeToggle = (type) => {
    setUserType(type);
    setDomainError('');
    dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check internal domain
    if (userType === 'internal') {
      const domain = collegeConfig?.domain || 'apex.edu';
      if (!formData.email.toLowerCase().endsWith(`@${domain.toLowerCase()}`)) {
        setDomainError(`Internal students & faculty must use official @${domain} email.`);
        return;
      }
    }

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      userType,
      ...(userType === 'internal'
        ? {
            rollNo: formData.rollNo,
            department: formData.department,
            year: formData.year
          }
        : {
            collegeName: formData.collegeName,
            phone: formData.phone,
            idCardUrl: formData.idCardUrl
          })
    };

    const resultAction = await dispatch(registerUser(payload));
    if (registerUser.fulfilled.match(resultAction)) {
      navigate('/verify-otp');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        {/* Glow ambient background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 blur-3xl pointer-events-none rounded-full -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-xl"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-soft-lg border border-slate-200/80 dark:border-slate-800/80">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl gradient-brand mx-auto flex items-center justify-center text-white shadow-soft mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Create EventHub Account
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Choose your participation category below to get started
              </p>
            </div>

            {/* User Type Toggle Tabs */}
            <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => handleUserTypeToggle('internal')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  userType === 'internal'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Internal ({collegeConfig?.shortName || 'AIT'} Member)</span>
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeToggle('external')}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                  userType === 'external'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <ExternalLink className="w-4 h-4" />
                <span>External Participant</span>
              </button>
            </div>

            {/* Error Banners */}
            {(error || domainError) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{domainError || error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  name="name"
                  type="text"
                  placeholder="e.g. John Doe"
                  icon={UserIcon}
                  required
                  value={formData.name}
                  onChange={handleChange}
                />

                <Input
                  label={
                    userType === 'internal'
                      ? `College Email (@${collegeConfig?.domain || 'apex.edu'})`
                      : 'Email Address'
                  }
                  name="email"
                  type="email"
                  placeholder={
                    userType === 'internal'
                      ? `student@${collegeConfig?.domain || 'apex.edu'}`
                      : 'john@example.com'
                  }
                  icon={Mail}
                  required
                  value={formData.email}
                  onChange={handleChange}
                  error={domainError}
                />
              </div>

              <Input
                label="Create Password"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                icon={Lock}
                required
                value={formData.password}
                onChange={handleChange}
              />

              {/* Conditional Fields: Internal */}
              {userType === 'internal' && (
                <div className="space-y-4 pt-1">
                  <Input
                    label="Student Roll No / Employee ID"
                    name="rollNo"
                    type="text"
                    placeholder="e.g. 22CS104"
                    icon={Building}
                    required
                    value={formData.rollNo}
                    onChange={handleChange}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Department <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="w-full rounded-xl text-sm py-2.5 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        {collegeConfig?.departments?.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Academic Year <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="year"
                        value={formData.year}
                        onChange={handleChange}
                        className="w-full rounded-xl text-sm py-2.5 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                        {collegeConfig?.years?.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional Fields: External */}
              {userType === 'external' && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="College / Organization Name"
                      name="collegeName"
                      type="text"
                      placeholder="e.g. National Institute of Tech"
                      icon={Building}
                      required
                      value={formData.collegeName}
                      onChange={handleChange}
                    />

                    <Input
                      label="Contact Phone Number"
                      name="phone"
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      icon={Phone}
                      required
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <Input
                    label="College ID Card URL (Optional)"
                    name="idCardUrl"
                    type="url"
                    placeholder="https://drive.google.com/... or image link"
                    helperText="Optional link to student verification proof"
                    value={formData.idCardUrl}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="pt-3">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                  icon={ArrowRight}
                  iconPosition="right"
                >
                  Create Account & Send OTP
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Already registered?{' '}
                <Link
                  to="/login"
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Sign in to your account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
