import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Calendar,
  MapPin,
  QrCode,
  Download,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Utensils,
  Coffee,
  Check,
  AlertCircle,
  FileText,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { fetchMyTickets } from '../../features/tickets/ticketSlice';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Skeleton from '../../components/common/Skeleton';

const MyTicketsPage = () => {
  const dispatch = useDispatch();
  const { myTickets, isLoading } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState('ticket'); // 'ticket' | 'lunch' | 'refreshment'
  const [foodCoupons, setFoodCoupons] = useState([]);
  const [activeMainTab, setActiveMainTab] = useState('all'); // 'all' | 'food'
  const [downloadingOd, setDownloadingOd] = useState(false);

  // Rotating QR state
  const [rotatingData, setRotatingData] = useState(null);
  const [rotatingCountdown, setRotatingCountdown] = useState(30);
  const [isRotatingLoading, setIsRotatingLoading] = useState(false);

  // Auto-refresh rotating QR every 30 seconds
  useEffect(() => {
    let timer;
    if (selectedTicket && activeModalTab === 'ticket') {
      const loadRotatingPass = async () => {
        try {
          setIsRotatingLoading(true);
          const res = await api.get(
            `/registrations/ticket/${selectedTicket.ticketCode}/rotating-qr`
          );
          setRotatingData(res.data);
          setRotatingCountdown(res.data.expiresInSeconds || 30);
        } catch (err) {
          console.error('Failed to load rotating pass:', err);
        } finally {
          setIsRotatingLoading(false);
        }
      };

      loadRotatingPass();

      timer = setInterval(() => {
        setRotatingCountdown((prev) => {
          if (prev <= 1) {
            loadRotatingPass();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setRotatingData(null);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [selectedTicket, activeModalTab]);

  useEffect(() => {
    dispatch(fetchMyTickets());
    const fetchCoupons = async () => {
      try {
        const res = await api.get('/food-coupons/my-coupons');
        setFoodCoupons(res.data.coupons || []);
      } catch (err) {
        console.error('Coupons fetch error:', err);
      }
    };
    fetchCoupons();
  }, [dispatch]);

  const handlePrintTicket = () => {
    window.print();
  };

  const handleDownloadOdLetter = async (eventId, eventTitle) => {
    try {
      setDownloadingOd(true);
      const res = await api.get(`/registrations/od-letter/${eventId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `OD_Letter_${(eventTitle || 'Event').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download OD letter:', err);
      alert(
        err.response?.data?.message ||
          'Failed to download OD Letter. Ensure your gate attendance is recorded and you are an internal student.'
      );
    } finally {
      setDownloadingOd(false);
    }
  };

  const getCouponsForEvent = (eventId) => {
    return {
      lunch: foodCoupons.find(
        (c) => c.event?._id === eventId && c.couponType === 'lunch'
      ),
      refreshment: foodCoupons.find(
        (c) => c.event?._id === eventId && c.couponType === 'refreshment'
      )
    };
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              Digital Passport & Credentials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Event Passes & Food Coupons
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access your verifiable QR code entry passes, plus lunch and refreshment coupons for all registered events.
          </p>
        </div>

        <Link to="/events">
          <Button variant="secondary" size="md" icon={Ticket}>
            Browse More Events
          </Button>
        </Link>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveMainTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'all'
              ? 'bg-indigo-600 text-white shadow-soft'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Event Passes ({myTickets.length})</span>
        </button>

        <button
          onClick={() => setActiveMainTab('food')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeMainTab === 'food'
              ? 'bg-amber-600 text-white shadow-soft'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Food & Refreshment Coupons ({foodCoupons.length})</span>
        </button>
      </div>

      {/* Passes Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-4"
            >
              <Skeleton className="w-1/3 h-5" />
              <Skeleton className="w-full h-8" />
              <Skeleton className="w-2/3 h-4" />
            </div>
          ))}
        </div>
      ) : myTickets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 mb-4">
            <Ticket className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Registrations Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            You haven't registered for any events yet. Explore open events and claim your pass.
          </p>
          <Link to="/events">
            <Button size="md" className="mt-5" icon={ArrowRight} iconPosition="right">
              Discover Campus Events
            </Button>
          </Link>
        </div>
      ) : activeMainTab === 'food' ? (
        /* Dedicated Food Coupons View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {foodCoupons.map((coupon) => (
            <motion.div
              key={coupon._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-3xl border-2 shadow-soft flex flex-col justify-between ${
                coupon.couponType === 'lunch'
                  ? 'bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/30'
                  : 'bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border-emerald-500/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                        coupon.couponType === 'lunch'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {coupon.couponType === 'lunch' ? (
                        <Utensils className="w-4 h-4" />
                      ) : (
                        <Coffee className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      {coupon.couponType === 'lunch' ? 'Lunch Meal Token' : 'Refreshment Token'}
                    </span>
                  </div>

                  <Badge
                    variant={coupon.isRedeemed ? 'default' : 'success'}
                    size="sm"
                    dot={!coupon.isRedeemed}
                  >
                    {coupon.isRedeemed ? 'Redeemed' : 'Ready to Use'}
                  </Badge>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                  {coupon.event?.title}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{coupon.couponCode}</p>

                {/* QR Code Preview */}
                <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
                  <img
                    src={coupon.qrCodeDataUrl}
                    alt="Coupon QR"
                    className={`w-24 h-24 rounded-xl border p-1 ${
                      coupon.isRedeemed ? 'opacity-40 grayscale' : ''
                    }`}
                  />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Single-Use Meal QR
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      Present this QR code to the volunteer at the food counter.
                    </p>
                    {coupon.isRedeemed ? (
                      <p className="text-[11px] font-bold text-amber-600 flex items-center gap-1 pt-1">
                        <Check className="w-3.5 h-3.5" /> Redeemed on{' '}
                        {new Date(coupon.redeemedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    ) : (
                      <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 1 Meal Available
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Event Passes Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {myTickets.map((ticket, idx) => {
              const evt = ticket.event;
              if (!evt) return null;

              const coupons = getCouponsForEvent(evt._id);

              const startDate = new Date(evt.startDate).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const startTime = new Date(evt.startDate).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <motion.div
                  key={ticket._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft overflow-hidden flex flex-col justify-between relative group hover:shadow-soft-lg transition-all"
                >
                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="primary" size="sm">
                        {evt.category}
                      </Badge>
                      <Badge
                        variant={ticket.checkedIn ? 'success' : 'default'}
                        size="sm"
                        dot
                      >
                        {ticket.checkedIn ? 'Checked In' : 'Confirmed Pass'}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      {evt.department}
                    </p>

                    <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>
                          {startDate} at {startTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="truncate">{evt.venueLocation}</span>
                      </div>
                    </div>

                    {/* Food Coupon Quick Badges */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-[11px] font-bold">
                        <Utensils className="w-3.5 h-3.5" />
                        <span>
                          Lunch: {coupons.lunch?.isRedeemed ? 'Redeemed' : 'Included'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                        <Coffee className="w-3.5 h-3.5" />
                        <span>
                          Refreshments: {coupons.refreshment?.isRedeemed ? 'Redeemed' : 'Included'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Perforated divider look */}
                  <div className="relative py-2 flex items-center">
                    <div className="w-4 h-8 bg-slate-50 dark:bg-[#0b0f19] rounded-r-full -ml-2 border-r border-slate-200/80 dark:border-slate-800/80" />
                    <div className="flex-1 border-b-2 border-dashed border-slate-200 dark:border-slate-800" />
                    <div className="w-4 h-8 bg-slate-50 dark:bg-[#0b0f19] rounded-l-full -mr-2 border-l border-slate-200/80 dark:border-slate-800/80" />
                  </div>

                  {/* Ticket Bottom QR & Actions */}
                  <div className="p-6 pt-2 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-3">
                      <img
                        src={ticket.qrCodeDataUrl}
                        alt="Gate QR Code"
                        className="w-14 h-14 rounded-xl bg-white p-1 border border-slate-200 dark:border-slate-700 shadow-sm"
                      />
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Pass Code
                        </span>
                        <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {ticket.ticketCode}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user?.userType === 'internal' && ticket.checkedIn && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="border border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300"
                          icon={FileText}
                          isLoading={downloadingOd}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadOdLetter(evt._id, evt.title);
                          }}
                        >
                          OD Letter
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="primary"
                        icon={QrCode}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setActiveModalTab('ticket');
                        }}
                      >
                        View Pass & Food QRs
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Ticket & Food Coupons Modal */}
      <Modal
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        title="Event Access & Catering Tokens"
        size="md"
      >
        {selectedTicket && (
          <div className="space-y-5">
            {/* Modal Tabs: Ticket QR, Lunch QR, Refreshment QR */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveModalTab('ticket')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeModalTab === 'ticket'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Gate Pass</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('lunch')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeModalTab === 'lunch'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Lunch QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalTab('refreshment')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeModalTab === 'refreshment'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>Refreshment QR</span>
              </button>
            </div>

            {/* Tab 1: Gate Pass */}
            {activeModalTab === 'ticket' && (
              <div className="space-y-4 text-center">
                {/* Rotating Badge & Countdown Bar */}
                <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-900/60 text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                      <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Dynamic Rotating Security QR
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400">
                      <RefreshCw
                        className={`w-3 h-3 ${isRotatingLoading ? 'animate-spin' : ''}`}
                      />
                      Rotates in {rotatingCountdown}s
                    </span>
                  </div>

                  {/* 30s Progress Bar */}
                  <div className="w-full bg-indigo-200/60 dark:bg-indigo-900/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 dark:bg-indigo-400 h-1.5 rounded-full transition-all duration-1000 ease-linear"
                      style={{
                        width: `${Math.max(0, Math.min(100, (rotatingCountdown / 30) * 100))}%`
                      }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Token changes every 30 seconds to prevent unauthorized screenshot sharing.
                  </p>
                </div>

                {/* QR Display */}
                <div className="p-4 rounded-3xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 inline-block mx-auto relative group">
                  <img
                    src={rotatingData?.qrCodeDataUrl || selectedTicket.qrCodeDataUrl}
                    alt="Live Rotating QR Code"
                    className="w-48 h-48 mx-auto rounded-2xl bg-white p-2 border shadow-soft transition-opacity duration-300"
                  />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-mono tracking-wider backdrop-blur-sm">
                    30s Window
                  </div>
                </div>

                {/* Attendance Window Status */}
                {rotatingData?.event?.attendanceWindow && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between text-left ${
                      rotatingData.event.attendanceWindow.isOpen
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {rotatingData.event.attendanceWindow.isOpen
                        ? 'Attendance Window Active'
                        : 'Attendance Window Closed'}
                    </span>
                    <span className="text-[10px] opacity-80">
                      {rotatingData.event.attendanceWindow.isOpen
                        ? 'Valid for admission scan'
                        : 'Scans rejected outside window'}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedTicket.event?.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Pass Code:{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">
                      {selectedTicket.ticketCode}
                    </strong>
                  </p>
                  {rotatingData?.token && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-xs mx-auto">
                      Security Token: {rotatingData.token}
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl text-left space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Attendee Name:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {user?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gate Check-in:</span>
                    <span
                      className={`font-bold ${
                        selectedTicket.checkedIn ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {selectedTicket.checkedIn ? 'Admitted' : 'Pending Gate Scan'}
                    </span>
                  </div>
                </div>

                {/* OD Letter Section */}
                {user?.userType === 'internal' ? (
                  <div className="p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950 dark:text-indigo-200">
                          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span>Official On Duty (OD) Letter</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {selectedTicket.checkedIn
                            ? 'Gate attendance verified. Download your signed academic OD certificate.'
                            : 'Unlocks automatically once your attendance is recorded by gate scan.'}
                        </p>
                      </div>

                      {selectedTicket.checkedIn ? (
                        <Button
                          size="sm"
                          variant="primary"
                          icon={Download}
                          isLoading={downloadingOd}
                          onClick={() =>
                            handleDownloadOdLetter(
                              selectedTicket.event?._id || selectedTicket.event,
                              selectedTicket.event?.title
                            )
                          }
                        >
                          Download PDF
                        </Button>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2 py-1 rounded-lg">
                          Locked
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center">
                    OD letters are issued strictly for enrolled institutional students.
                  </p>
                )}
              </div>
            )}

            {/* Tab 2: Lunch QR */}
            {activeModalTab === 'lunch' && (
              <div className="space-y-4 text-center">
                {(() => {
                  const lunch = getCouponsForEvent(selectedTicket.event?._id).lunch;
                  if (!lunch) {
                    return (
                      <p className="text-xs text-slate-500 py-6">
                        Generating your lunch coupon...
                      </p>
                    );
                  }
                  return (
                    <>
                      <div className="p-4 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 inline-block mx-auto">
                        <img
                          src={lunch.qrCodeDataUrl}
                          alt="Lunch QR"
                          className={`w-48 h-48 mx-auto rounded-2xl bg-white p-2 border shadow-soft ${
                            lunch.isRedeemed ? 'opacity-40 grayscale' : ''
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Utensils className="w-4 h-4 text-amber-600" />
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            Official Lunch Coupon
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          Coupon Code:{' '}
                          <strong className="text-amber-600">{lunch.couponCode}</strong>
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl text-xs text-left bg-slate-50 dark:bg-slate-800/60 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Coupon Status:</span>
                          <span
                            className={`font-bold ${
                              lunch.isRedeemed ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {lunch.isRedeemed ? 'Already Redeemed' : 'Ready to Redeem'}
                          </span>
                        </div>
                        {lunch.isRedeemed && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Redeemed At:</span>
                            <span>{new Date(lunch.redeemedAt).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Tab 3: Refreshment QR */}
            {activeModalTab === 'refreshment' && (
              <div className="space-y-4 text-center">
                {(() => {
                  const refr = getCouponsForEvent(selectedTicket.event?._id).refreshment;
                  if (!refr) {
                    return (
                      <p className="text-xs text-slate-500 py-6">
                        Generating your refreshment coupon...
                      </p>
                    );
                  }
                  return (
                    <>
                      <div className="p-4 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 inline-block mx-auto">
                        <img
                          src={refr.qrCodeDataUrl}
                          alt="Refreshment QR"
                          className={`w-48 h-48 mx-auto rounded-2xl bg-white p-2 border shadow-soft ${
                            refr.isRedeemed ? 'opacity-40 grayscale' : ''
                          }`}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <Coffee className="w-4 h-4 text-emerald-600" />
                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                            Official Refreshment Coupon
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          Coupon Code:{' '}
                          <strong className="text-emerald-600">{refr.couponCode}</strong>
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl text-xs text-left bg-slate-50 dark:bg-slate-800/60 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Coupon Status:</span>
                          <span
                            className={`font-bold ${
                              refr.isRedeemed ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {refr.isRedeemed ? 'Already Redeemed' : 'Ready to Redeem'}
                          </span>
                        </div>
                        {refr.isRedeemed && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Redeemed At:</span>
                            <span>{new Date(refr.redeemedAt).toLocaleTimeString()}</span>
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="flex gap-3 justify-center pt-2">
              <Button size="sm" variant="secondary" onClick={() => setSelectedTicket(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyTicketsPage;
