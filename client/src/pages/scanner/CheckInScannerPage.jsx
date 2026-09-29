import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Scan,
  CheckCircle2,
  AlertCircle,
  Clock,
  UserCheck,
  Building,
  RefreshCw,
  Search,
  Sparkles,
  Utensils
} from 'lucide-react';
import { checkInAttendee, clearTicketMessages } from '../../features/tickets/ticketSlice';
import { fetchEvents } from '../../features/events/eventSlice';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';

const CheckInScannerPage = () => {
  const dispatch = useDispatch();

  const { events } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);
  const { lastCheckIn, isLoading, error } = useSelector((state) => state.tickets);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [ticketCodeInput, setTicketCodeInput] = useState('');
  const [recentAdmissions, setRecentAdmissions] = useState([]);

  useEffect(() => {
    dispatch(fetchEvents({ status: 'approved' }));
    return () => {
      dispatch(clearTicketMessages());
    };
  }, [dispatch]);

  // Set default event
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id);
    }
  }, [events, selectedEventId]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!ticketCodeInput.trim() || !selectedEventId) return;

    const code = ticketCodeInput.trim().toUpperCase();
    const result = await dispatch(
      checkInAttendee({
        ticketCode: code,
        eventId: selectedEventId
      })
    );

    if (checkInAttendee.fulfilled.match(result)) {
      setRecentAdmissions((prev) => [
        {
          id: Date.now(),
          ...result.payload
        },
        ...prev.slice(0, 9)
      ]);
      setTicketCodeInput('');
    }
  };

  const selectedEvent = events.find((e) => e._id === selectedEventId);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Top Switcher: Gate Pass vs Food Coupon Scanner */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-soft flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            Gate Entrance Scanner
          </button>
          <Link to="/scanner/food">
            <button className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Food & Refreshment Scanner
            </button>
          </Link>
        </div>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
            Entrance Gate & Access Control
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <QrCode className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <span>QR Check-in Scanner</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Scan attendee digital passes or manually type pass codes to record verified event attendance.
        </p>
      </div>

      {/* Event Selector Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto flex-1">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
            Active Event Venue
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full sm:max-w-md py-2.5 px-3 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title} ({evt.department})
              </option>
            ))}
          </select>
        </div>

        {selectedEvent && (
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 w-full sm:w-auto justify-end">
            <div>
              <span className="block font-bold text-slate-900 dark:text-white text-sm">
                {selectedEvent.registeredCount || 0} / {selectedEvent.capacity}
              </span>
              <span>Total Registered</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Code Scanner Input & Verification Display */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Scan className="w-5 h-5 text-indigo-500" />
              Scan or Enter Pass Code
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Use a barcode/QR hardware scanner or enter the 8-character ticket code.
            </p>

            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. EH-2026-A1B2 or scan QR..."
                  value={ticketCodeInput}
                  onChange={(e) => setTicketCodeInput(e.target.value.toUpperCase())}
                  autoFocus
                  className="w-full text-lg sm:text-xl font-mono uppercase tracking-wider pl-4 pr-32 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-indigo-500/30 focus:border-indigo-600 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-400 placeholder:normal-case placeholder:tracking-normal placeholder:text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isLoading}
                    disabled={!ticketCodeInput.trim()}
                  >
                    Check In
                  </Button>
                </div>
              </div>
            </form>

            {/* Live Verification Status Feedback */}
            <div className="mt-6">
              <AnimatePresence mode="wait">
                {lastCheckIn?.success && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 space-y-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold uppercase tracking-wide">
                          Check-in Verified!
                        </h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          {lastCheckIn.message}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Attendee</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {lastCheckIn.attendee?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Identifier</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {lastCheckIn.attendee?.rollNo || lastCheckIn.attendee?.collegeName}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Pass Code</span>
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                          {lastCheckIn.ticketCode}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                        <span className="text-slate-700 dark:text-slate-300">
                          {new Date(lastCheckIn.checkedInAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {lastCheckIn?.alreadyCheckedIn && (
                  <motion.div
                    key="already"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 space-y-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold uppercase tracking-wide">
                          Already Admitted!
                        </h4>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          This pass was previously scanned at{' '}
                          {new Date(lastCheckIn.checkedInAt).toLocaleTimeString()}.
                        </p>
                      </div>
                    </div>
                    {lastCheckIn.attendee && (
                      <p className="text-xs font-semibold">
                        Attendee: {lastCheckIn.attendee.name} ({lastCheckIn.attendee.rollNo})
                      </p>
                    )}
                  </motion.div>
                )}

                {lastCheckIn && !lastCheckIn.success && !lastCheckIn.alreadyCheckedIn && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className={`p-5 rounded-2xl border-2 flex items-start gap-3.5 ${
                      lastCheckIn.isOutsideWindow
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/50 text-amber-900 dark:text-amber-200'
                        : lastCheckIn.isExpired
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500/50 text-orange-900 dark:text-orange-200'
                        : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/40 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        lastCheckIn.isOutsideWindow
                          ? 'bg-amber-500 text-white'
                          : lastCheckIn.isExpired
                          ? 'bg-orange-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {lastCheckIn.isOutsideWindow ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold uppercase tracking-wide">
                        {lastCheckIn.isOutsideWindow
                          ? 'Attendance Window Closed'
                          : lastCheckIn.isExpired
                          ? 'Expired Rotating Token (Screenshot Blocked)'
                          : 'Check-in Rejected'}
                      </h4>
                      <p className="text-xs mt-0.5 leading-relaxed font-medium">
                        {error || lastCheckIn.message}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Column: Live Admissions Feed */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Live Entrance Feed
              </h3>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>

            {recentAdmissions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <p>Waiting for admissions...</p>
                <p className="text-[10px] mt-1 text-slate-500">
                  Scanned passes will appear here in real-time.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {recentAdmissions.map((adm) => (
                  <div
                    key={adm.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {adm.attendee?.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {adm.attendee?.rollNo || adm.attendee?.collegeName} • {adm.ticketCode}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {new Date(adm.checkedInAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
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

export default CheckInScannerPage;
