import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Scan,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  TrendingUp,
  RefreshCw,
  QrCode,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';

const FoodScannerPage = () => {
  const { addToast } = useToast();
  const { user } = useSelector((state) => state.auth);

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch approved events
  useEffect(() => {
    const fetchEventsList = async () => {
      try {
        const res = await api.get('/events', { params: { status: 'approved' } });
        setEvents(res.data.events || []);
        if (res.data.events?.length > 0) {
          setSelectedEventId(res.data.events[0]._id);
        }
      } catch (err) {
        addToast('Failed to load events.', 'error');
      }
    };
    fetchEventsList();
  }, []);

  // Fetch food stats when event changes
  const fetchLiveFoodStats = async () => {
    if (!selectedEventId) return;
    setIsLoadingStats(true);
    try {
      const res = await api.get(`/food-coupons/stats/${selectedEventId}`);
      setStats(res.data);
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchLiveFoodStats();
    const interval = setInterval(fetchLiveFoodStats, 8000); // 8s auto-refresh for live counter
    return () => clearInterval(interval);
  }, [selectedEventId]);

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;

    setIsScanning(true);
    const code = couponCodeInput.trim().toUpperCase();

    try {
      const res = await api.post('/food-coupons/redeem', { couponCode: code });
      setLastScanResult({
        status: 'success',
        message: res.data.message,
        coupon: res.data.coupon
      });
      addToast(res.data.message, 'success');
      setCouponCodeInput('');
      fetchLiveFoodStats();
    } catch (err) {
      const data = err.response?.data;
      if (data?.isAlreadyRedeemed) {
        setLastScanResult({
          status: 'already_redeemed',
          message: data.message || 'Already redeemed.',
          coupon: data.coupon
        });
        addToast(data.message, 'warning');
      } else {
        setLastScanResult({
          status: 'error',
          message: data?.message || 'Invalid coupon code or redemption failed.'
        });
        addToast(data?.message || 'Redemption failed', 'error');
      }
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Top Switcher: Gate Pass vs Food Coupon Scanner */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <Link to="/scanner">
            <button className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Gate Entrance Scanner
            </button>
          </Link>
          <button className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-2">
            <Utensils className="w-4 h-4" />
            Food & Refreshment Scanner
          </button>
        </div>

        <Button
          size="xs"
          variant="secondary"
          icon={RefreshCw}
          onClick={fetchLiveFoodStats}
          isLoading={isLoadingStats}
        >
          Refresh Live Counts
        </Button>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold text-amber-600 dark:text-amber-400 tracking-wider">
            Volunteer & Catering Control
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Utensils className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          <span>Food Coupon Scanner & Live Counter</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Redeem single-use lunch and refreshment QR coupons. Second scans immediately display "Already redeemed".
        </p>
      </div>

      {/* Event Selector */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
            Active Event for Catering
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full sm:max-w-md py-2.5 px-3 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          >
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title} ({evt.department})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Live Organizer Food Counts Section */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lunch Counter Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/20 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Lunch Distribution
                  </h3>
                  <p className="text-xs text-slate-500">Live redemption count</p>
                </div>
              </div>
              <Badge variant="warning" size="sm">
                {stats.lunch.percentage}% Served
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.lunch.percentage}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Allocated</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {stats.lunch.total}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                  Redeemed
                </span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.lunch.redeemed}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Remaining</span>
                <span className="text-xl font-extrabold text-slate-700 dark:text-slate-300">
                  {stats.lunch.remaining}
                </span>
              </div>
            </div>
          </div>

          {/* Refreshment Counter Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500/20 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Refreshments Distribution
                  </h3>
                  <p className="text-xs text-slate-500">Live redemption count</p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                {stats.refreshment.percentage}% Served
              </Badge>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.refreshment.percentage}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Allocated</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {stats.refreshment.total}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">
                  Redeemed
                </span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.refreshment.redeemed}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Remaining</span>
                <span className="text-xl font-extrabold text-slate-700 dark:text-slate-300">
                  {stats.refreshment.remaining}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Coupon Input & Verification Feedback */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Scan className="w-5 h-5 text-amber-500" />
              <span>Redeem Coupon Code / QR</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Enter or scan the student's coupon code (e.g., <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold">FC-LUNCH-2026-XXXX</code> or <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono font-bold">FC-REFR-2026-XXXX</code>).
            </p>

            <form onSubmit={handleRedeemSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="e.g. FC-LUNCH-2026-CBB01E"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm font-mono font-bold uppercase rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 tracking-wider"
                />
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  isLoading={isScanning}
                  icon={CheckCircle2}
                  className="bg-amber-600 hover:bg-amber-500"
                >
                  Verify & Redeem
                </Button>
              </div>
            </form>

            {/* Scan Status Card */}
            <AnimatePresence mode="wait">
              {lastScanResult && (
                <motion.div
                  key={lastScanResult.status + lastScanResult.message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-6 p-6 rounded-2xl border-2 ${
                    lastScanResult.status === 'success'
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500'
                      : lastScanResult.status === 'already_redeemed'
                      ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500'
                      : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-500'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {lastScanResult.status === 'success' ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 shrink-0 mt-0.5" />
                    ) : lastScanResult.status === 'already_redeemed' ? (
                      <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                    ) : (
                      <AlertTriangle className="w-7 h-7 text-rose-600 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-extrabold uppercase tracking-wider ${
                            lastScanResult.status === 'success'
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : lastScanResult.status === 'already_redeemed'
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-rose-700 dark:text-rose-400'
                          }`}
                        >
                          {lastScanResult.status === 'success'
                            ? 'Coupon Validated Successfully'
                            : lastScanResult.status === 'already_redeemed'
                            ? 'Already Redeemed!'
                            : 'Verification Failed'}
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                        {lastScanResult.message}
                      </h4>

                      {lastScanResult.coupon && (
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-white/70 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <div>
                            <span className="text-slate-400">Attendee:</span>{' '}
                            <strong className="text-slate-800 dark:text-slate-200">
                              {lastScanResult.coupon.recipientName}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-400">ID/Roll:</span>{' '}
                            <span className="font-mono">{lastScanResult.coupon.rollNo}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Type:</span>{' '}
                            <span className="font-bold uppercase text-amber-600">
                              {lastScanResult.coupon.couponType}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400">Redeemed At:</span>{' '}
                            <span>
                              {new Date(lastScanResult.coupon.redeemedAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Live Feed of Recent Redemptions */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>Recent Redemptions</span>
              <span className="text-[11px] font-normal text-slate-400">Auto-refreshing</span>
            </h3>

            {stats?.recentRedemptions?.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No coupons redeemed yet for this event.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {stats?.recentRedemptions?.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {r.recipientName}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                            r.couponType === 'lunch'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {r.couponType}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {r.rollNo}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {new Date(r.redeemedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodScannerPage;
