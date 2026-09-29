import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  verifyOtp,
  resendOtp,
  clearError,
  clearSuccessMessage
} from '../../features/auth/authSlice';
import Button from '../../components/common/Button';
import Navbar from '../../components/layout/Navbar';

const VerifyOtpPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    isLoading,
    error,
    successMessage,
    pendingEmail,
    otpPreview,
    isAuthenticated
  } = useSelector((state) => state.auth);

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    dispatch(clearError());
    dispatch(clearSuccessMessage());
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [dispatch]);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto move to next input if filled
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) return;

    const email = pendingEmail || localStorage.getItem('eventhub_pending_email');
    if (!email) {
      navigate('/login');
      return;
    }

    const resultAction = await dispatch(verifyOtp({ email, otp: fullOtp }));
    if (verifyOtp.fulfilled.match(resultAction)) {
      navigate('/dashboard');
    }
  };

  const handleResend = async () => {
    const email = pendingEmail || localStorage.getItem('eventhub_pending_email');
    if (!email) return;

    setCanResend(false);
    setCountdown(60);
    await dispatch(resendOtp(email));
  };

  const emailToDisplay = pendingEmail || localStorage.getItem('eventhub_pending_email') || 'your email';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/15 blur-3xl pointer-events-none rounded-full -z-10" />

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-soft-lg border border-slate-200/80 dark:border-slate-800/80 text-center">
            {/* Icon */}
            <div className="w-14 h-14 rounded-2xl gradient-brand mx-auto flex items-center justify-center text-white shadow-soft mb-4">
              <KeyRound className="w-7 h-7" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Verify Email Address
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              We've sent a 6-digit confirmation code to:
            </p>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 break-all">
              {emailToDisplay}
            </p>

            {/* Development OTP preview helper */}
            {otpPreview && (
              <div className="mt-4 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2">
                <span>Dev Preview Code:</span>
                <span className="font-mono font-bold tracking-widest text-sm bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-indigo-300 dark:border-indigo-700">
                  {otpPreview}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const digits = otpPreview.split('');
                    setOtpDigits(digits);
                  }}
                  className="underline ml-1 font-semibold hover:text-indigo-900"
                >
                  (Auto-fill)
                </button>
              </div>
            )}

            {/* Alerts */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 text-left"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* OTP 6-box input */}
            <form onSubmit={handleSubmit} className="mt-6">
              <div className="flex justify-center gap-2 sm:gap-2.5 mb-6" onPaste={handlePaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-200"
                  />
                ))}
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={otpDigits.join('').length !== 6 || isLoading}
                isLoading={isLoading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Verify & Continue
              </Button>
            </form>

            {/* Resend actions */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <Link to="/login" className="hover:text-slate-800 dark:hover:text-slate-200">
                Back to Login
              </Link>

              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resend Code</span>
                </button>
              ) : (
                <span>
                  Resend code in <strong className="text-slate-700 dark:text-slate-300">{countdown}s</strong>
                </span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
