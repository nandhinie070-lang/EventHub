import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Tag,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Share2,
  Building,
  UserCheck,
  QrCode,
  Download,
  Star,
  MessageSquare,
  Sparkles,
  Utensils,
  Coffee,
  Plus,
  Trash2,
  Send,
  Lock,
  Award,
  FileText
} from 'lucide-react';
import {
  fetchEventById,
  approveHod,
  approvePrincipal,
  clearEventMessages
} from '../../features/events/eventSlice';
import { registerForEvent } from '../../features/tickets/ticketSlice';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Skeleton from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

const EventDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { currentEvent: event, isLoading, error } = useSelector(
    (state) => state.events
  );
  const { user } = useSelector((state) => state.auth);

  // Approvals & Registration state
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject'
  const [reviewRemarks, setReviewRemarks] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [registeredTicket, setRegisteredTicket] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regCustomResponses, setRegCustomResponses] = useState({});

  // Feature 3: Event Report PDF State
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Feature 3: Event Updates Feed State
  const [updates, setUpdates] = useState([]);
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    category: 'venue',
    title: '',
    message: '',
    priority: 'normal'
  });

  // Feature 1: Feedback State
  const [feedbackData, setFeedbackData] = useState({
    totalReviews: 0,
    averageRating: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    feedbacks: []
  });
  const [myFeedbackStatus, setMyFeedbackStatus] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Active tab in main section
  const [activeTab, setActiveTab] = useState('updates'); // 'updates' | 'about' | 'feedback'

  const fetchUpdates = async () => {
    try {
      const res = await api.get(`/event-updates/${id}`);
      setUpdates(res.data.updates || []);
    } catch (err) {
      console.error('Failed to load updates:', err);
    }
  };

  const fetchFeedback = async () => {
    try {
      const res = await api.get(`/feedback/event/${id}`);
      setFeedbackData(res.data);
      if (user) {
        const myRes = await api.get(`/feedback/my/${id}`);
        setMyFeedbackStatus(myRes.data);
      }
    } catch (err) {
      console.error('Failed to load feedback:', err);
    }
  };

  useEffect(() => {
    dispatch(fetchEventById(id));
    fetchUpdates();
    fetchFeedback();
    return () => {
      dispatch(clearEventMessages());
    };
  }, [dispatch, id, user]);

  if (isLoading || !event) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <Skeleton variant="card" className="h-64" />
        <Skeleton className="w-1/2 h-8" />
        <Skeleton className="w-full h-24" />
      </div>
    );
  }

  // Check review rights
  const isHodForEvent =
    user &&
    (user.role === 'hod' || user.role === 'admin') &&
    (user.role === 'admin' || user.department === event.department);

  const canHodReview = isHodForEvent && event.status === 'pending_hod';
  const canPrincipalReview =
    user && (user.role === 'principal' || user.role === 'admin') && event.status === 'pending_principal';

  const isOrganizerOrAdmin =
    user &&
    (user.role === 'admin' ||
      (user.role === 'organizer' &&
        (event.organizer?._id === user._id || event.organizer === user._id)));

  const handleOpenReview = (action) => {
    setReviewAction(action);
    setReviewRemarks('');
    setIsReviewModalOpen(true);
  };

  const handleConfirmReview = async () => {
    setIsSubmittingReview(true);
    try {
      if (canHodReview) {
        await dispatch(
          approveHod({
            id: event._id,
            action: reviewAction,
            remarks: reviewRemarks
          })
        ).unwrap();
        addToast(
          reviewAction === 'approve'
            ? 'Event approved and forwarded to Principal!'
            : 'Event proposal rejected.',
          reviewAction === 'approve' ? 'success' : 'error'
        );
      } else if (canPrincipalReview) {
        await dispatch(
          approvePrincipal({
            id: event._id,
            action: reviewAction,
            remarks: reviewRemarks
          })
        ).unwrap();
        addToast(
          reviewAction === 'approve'
            ? 'Event officially sanctioned and published!'
            : 'Event proposal rejected.',
          reviewAction === 'approve' ? 'success' : 'error'
        );
      }
      setIsReviewModalOpen(false);
      dispatch(fetchEventById(id));
    } catch (err) {
      addToast(err || 'Action failed', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const registrationFields =
    event?.template?.customFields?.filter(
      (f) => f.target === 'registration' || f.target === 'both'
    ) || [];

  const handleRegisterClick = () => {
    if (registrationFields.length > 0) {
      setRegCustomResponses({});
      setIsRegisterModalOpen(true);
    } else {
      executeRegistration({});
    }
  };

  const executeRegistration = async (responses = {}) => {
    setIsRegistering(true);
    try {
      const res = await dispatch(
        registerForEvent({
          eventId: event._id,
          customFieldResponses: responses
        })
      ).unwrap();
      setRegisteredTicket(res.ticket);
      addToast(res.message || 'Registration confirmed!', 'success');
      setIsRegisterModalOpen(false);
      dispatch(fetchEventById(id));
    } catch (err) {
      addToast(err || 'Registration failed.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  // Feature 3: Post Update handler
  const handlePostUpdate = async (e) => {
    e.preventDefault();
    setIsPostingUpdate(true);
    try {
      const res = await api.post(`/event-updates/${id}`, updateFormData);
      addToast(res.data.message || 'Update broadcasted!', 'success');
      setUpdateFormData({
        category: 'venue',
        title: '',
        message: '',
        priority: 'normal'
      });
      setIsUpdateModalOpen(false);
      fetchUpdates();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to post update.', 'error');
    } finally {
      setIsPostingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    try {
      await api.delete(`/event-updates/${updateId}`);
      addToast('Update deleted.', 'info');
      fetchUpdates();
    } catch (err) {
      addToast(err.response?.data?.message || 'Delete failed.', 'error');
    }
  };

  // Feature 1: Submit Feedback handler
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim()) {
      addToast('Please enter your feedback comments.', 'warning');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const res = await api.post(`/feedback/${id}`, {
        rating,
        comment: feedbackComment.trim()
      });
      addToast(res.data.message || 'Feedback submitted! Certificate unlocked.', 'success');
      setIsFeedbackModalOpen(false);
      fetchFeedback();
    } catch (err) {
      addToast(err.response?.data?.message || 'Feedback submission failed.', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setDownloadingReport(true);
      const res = await api.get(`/events/${id}/report-pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Event_Report_${(event.title || 'Event').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      addToast('Post-event summary report PDF generated successfully!', 'success');
    } catch (err) {
      console.error('Failed to download event report:', err);
      addToast(
        err.response?.data?.message ||
          'Failed to download event report PDF. Authorized organizers only.',
        'error'
      );
    } finally {
      setDownloadingReport(false);
    }
  };

  const startDate = new Date(event.startDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const endDate = new Date(event.endDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const deadline = new Date(event.registrationDeadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'venue':
        return {
          icon: MapPin,
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900',
          label: 'Venue Update'
        };
      case 'time':
        return {
          icon: Clock,
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
          label: 'Schedule'
        };
      case 'lunch':
        return {
          icon: Utensils,
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900',
          label: 'Lunch Service'
        };
      case 'refreshments':
        return {
          icon: Coffee,
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
          label: 'Refreshments'
        };
      default:
        return {
          icon: Sparkles,
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900',
          label: 'Notice'
        };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Events</span>
        </button>

        <div className="flex items-center gap-2">
          {(isOrganizerOrAdmin || isHodForEvent || user?.role === 'principal') && (
            <Button
              variant="secondary"
              size="sm"
              icon={FileText}
              isLoading={downloadingReport}
              onClick={handleDownloadReport}
              className="border border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300"
            >
              Event Report (PDF)
            </Button>
          )}
          {event.status === 'approved' && (
            <Badge variant="success" dot size="md">
              Live & Open for Registration
            </Badge>
          )}
          {event.status.startsWith('pending') && (
            <Badge variant="warning" size="md">
              Sanction Pending ({event.status === 'pending_hod' ? 'HOD Tier' : 'Principal Tier'})
            </Badge>
          )}
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-soft-xl border border-slate-200/80 dark:border-slate-800/80 min-h-[300px] flex flex-col justify-end p-6 sm:p-10">
        <div
          className="absolute inset-0 bg-cover bg-center -z-10"
          style={{ backgroundImage: `url(${event.bannerUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
        </div>

        <div className="space-y-3 z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/20">
              {event.category}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/80 text-white backdrop-blur-md">
              {event.department}
            </span>
            {event.isPaid ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/80 text-white backdrop-blur-md">
                Entry Fee: ${event.fee}
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/80 text-white backdrop-blur-md">
                Free Registration
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {event.title}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2">
            <span>Organized by</span>
            <strong className="text-white">
              {event.organizer?.name || 'Department Lead'}
            </strong>
            <span>•</span>
            <span>{event.department}</span>
          </p>
        </div>
      </div>

      {/* Institutional Multi-Tier Approval Status Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Multi-Tier Approval & Sanction Audit Trail</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Strict campus governance required before event catalog release.
            </p>
          </div>

          {/* Action buttons for HOD & Principal */}
          {(canHodReview || canPrincipalReview) && (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() => handleOpenReview('reject')}
              >
                Reject Proposal
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => handleOpenReview('approve')}
              >
                Sanction Event
              </Button>
            </div>
          )}
        </div>

        {/* 3-Tier Step Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Tier 1: Proposal Draft */}
          <div className="p-4 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                1. Proposal Drafted
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Submitted by <strong>{event.organizer?.name || 'Organizer'}</strong>
            </p>
          </div>

          {/* Tier 2: HOD Review */}
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              event.approvals?.hod?.status === 'approved'
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                : event.approvals?.hod?.status === 'rejected'
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                2. Department HOD Review
              </span>
              {event.approvals?.hod?.status === 'approved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : event.approvals?.hod?.status === 'rejected' ? (
                <XCircle className="w-4 h-4 text-rose-500" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Status:{' '}
              <strong className="capitalize">{event.approvals?.hod?.status || 'Pending'}</strong>
            </p>
            {event.approvals?.hod?.remarks && (
              <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
                "{event.approvals.hod.remarks}"
              </p>
            )}
          </div>

          {/* Tier 3: Principal Sanction */}
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              event.approvals?.principal?.status === 'approved'
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                : event.approvals?.principal?.status === 'rejected'
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60'
                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                3. Principal Sanction
              </span>
              {event.approvals?.principal?.status === 'approved' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : event.approvals?.principal?.status === 'rejected' ? (
                <XCircle className="w-4 h-4 text-rose-500" />
              ) : (
                <Clock className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Status:{' '}
              <strong className="capitalize">{event.approvals?.principal?.status || 'Pending'}</strong>
            </p>
            {event.approvals?.principal?.remarks && (
              <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
                "{event.approvals.principal.remarks}"
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Tabs & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Interactive Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('updates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'updates'
                  ? 'bg-indigo-600 text-white shadow-soft'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Live Updates Feed ({updates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'about'
                  ? 'bg-indigo-600 text-white shadow-soft'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Tag className="w-4 h-4" />
              <span>Event Details</span>
            </button>

            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'feedback'
                  ? 'bg-indigo-600 text-white shadow-soft'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Feedback & Reviews ({feedbackData.totalReviews})</span>
            </button>
          </div>

          {/* TAB 1: Live Updates Feed (Feature 3) */}
          {activeTab === 'updates' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    <span>Live Announcements Timeline</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Real-time updates posted by the event organizers regarding venues, schedules, lunch, and refreshments.
                  </p>
                </div>

                {/* Organizer Broadcast Button */}
                {isOrganizerOrAdmin && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Plus}
                    onClick={() => setIsUpdateModalOpen(true)}
                  >
                    Post Update
                  </Button>
                )}
              </div>

              {/* Timeline Container */}
              {updates.length === 0 ? (
                <div className="p-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No updates posted yet
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Announcements from the organizer will appear here chronologically.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-indigo-200 dark:border-indigo-950 space-y-6">
                  {updates.map((upd) => {
                    const badgeInfo = getCategoryBadge(upd.category);
                    const IconComp = badgeInfo.icon;
                    const dateFormatted = new Date(upd.createdAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div key={upd._id} className="relative group">
                        {/* Timeline dot */}
                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-4 border-indigo-600" />

                        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:shadow-soft transition-all space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-extrabold uppercase border flex items-center gap-1.5 ${badgeInfo.color}`}
                              >
                                <IconComp className="w-3.5 h-3.5" />
                                {badgeInfo.label}
                              </span>

                              {upd.priority === 'urgent' && (
                                <Badge variant="danger" size="sm" dot>
                                  URGENT
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-slate-400">
                                {dateFormatted}
                              </span>
                              {isOrganizerOrAdmin && (
                                <button
                                  onClick={() => handleDeleteUpdate(upd._id)}
                                  className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                  title="Delete announcement"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {upd.title}
                          </h4>

                          <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                            {upd.message}
                          </p>

                          <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1">
                            <span>Posted by</span>
                            <strong className="text-slate-700 dark:text-slate-300">
                              {upd.postedBy?.name || 'Organizer'}
                            </strong>
                            <span>({upd.postedBy?.role || 'Lead'})</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: About & Description */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  About this Event
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>

                {/* Topic Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                      Topic Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Budget Breakdown */}
              {user &&
                ['organizer', 'hod', 'principal', 'admin'].includes(user.role) &&
                event.budget && (
                  <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      Budget & Resource Allocation
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        ${event.budget.estimated || 0}
                      </span>
                      <span className="text-xs text-slate-500">Estimated Total Expenditure</span>
                    </div>
                    {event.budget.breakdown && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                        {event.budget.breakdown}
                      </p>
                    )}
                  </div>
                )}
            </div>
          )}

          {/* TAB 3: Feedback & Certificate Gating (Feature 1) */}
          {activeTab === 'feedback' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-6">
              {/* Header with Star Summary */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="text-center p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                      {feedbackData.averageRating > 0 ? feedbackData.averageRating : '—'}
                    </span>
                    <div className="flex items-center justify-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3 h-3 ${
                            s <= Math.round(feedbackData.averageRating)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {feedbackData.totalReviews} Ratings
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Attendee Ratings & Reviews
                    </h3>
                    <p className="text-xs text-slate-500">
                      Feedback is required from attended students to unlock their official E-Certificate.
                    </p>
                  </div>
                </div>

                {/* Rating CTA */}
                {myFeedbackStatus?.isAttended && !myFeedbackStatus?.hasSubmitted && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={Star}
                    onClick={() => setIsFeedbackModalOpen(true)}
                  >
                    Rate & Unlock Certificate
                  </Button>
                )}

                {myFeedbackStatus?.hasSubmitted && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      Certificate Unlocked!
                    </span>
                    <Link to="/certificates">
                      <Button size="xs" variant="primary" icon={Download}>
                        View Pass
                      </Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              {feedbackData.feedbacks.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/40">
                  <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No reviews submitted yet
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Attended students can leave a rating and comment once checked in.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedbackData.feedbacks.map((f) => (
                    <div
                      key={f._id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {f.user?.name || 'Attendee'}
                          </strong>
                          <span className="text-[10px] text-slate-400">
                            • {f.user?.department || 'Student'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= f.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        "{f.comment}"
                      </p>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Event Logistics & Registration */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
              Event Logistics
            </h3>

            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Start Time</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{startDate}</p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2">End Time</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{endDate}</p>
              </div>
            </div>

            {/* Venue */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Venue & Mode</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                  {event.venueMode} • {event.venueLocation}
                </p>
              </div>
            </div>

            {/* Registration Deadline */}
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Registration Closes
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{deadline}</p>
              </div>
            </div>

            {/* Capacity Meter */}
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
              <div className="w-full">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Participation</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {event.registeredCount || 0} / {event.capacity} seats filled
                </p>
              </div>
            </div>

            {/* Catering Inclusions Banner */}
            <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/60 space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                Catering Included
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-amber-600" /> Lunch +{' '}
                <Coffee className="w-3.5 h-3.5 text-emerald-600" /> Refreshments QR Tokens
              </p>
            </div>

            {/* Registration CTA Button */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              {event.status === 'approved' ? (
                <Button
                  size="lg"
                  className="w-full shadow-glow"
                  isLoading={isRegistering}
                  onClick={handleRegisterClick}
                >
                  Register Now
                </Button>
              ) : (
                <p className="text-xs text-center text-amber-600 dark:text-amber-400 font-medium p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  Registration opens once event is sanctioned.
                </p>
              )}
            </div>
          </div>

          {/* Feature 3: Organizer Event Closure & Analytics Report */}
          {(isOrganizerOrAdmin || isHodForEvent || user?.role === 'principal') && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Organizer Audit & Event Report
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Download the official institutional closure report containing registration turnout, gate attendance %, food coupon redemption metrics, attendee star feedback, and ground issue SLA breakdown.
              </p>
              <Button
                size="sm"
                variant="primary"
                className="w-full shadow-soft"
                icon={FileText}
                isLoading={downloadingReport}
                onClick={handleDownloadReport}
              >
                Download Event Report (PDF)
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Organizer Broadcast Update Modal (Feature 3) */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Broadcast Event Announcement / Update"
        size="md"
      >
        <form onSubmit={handlePostUpdate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Category
            </label>
            <select
              value={updateFormData.category}
              onChange={(e) =>
                setUpdateFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="venue">Venue Update (Room/Block change)</option>
              <option value="time">Time Schedule (Keynote/Session time)</option>
              <option value="lunch">Lunch Service (Counter ready / Location)</option>
              <option value="refreshments">Refreshments (Tea / Snacks call)</option>
              <option value="other">Other Campus Notice</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Announcement Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lunch Buffet is Now Served at Dining Hall B"
              value={updateFormData.title}
              onChange={(e) =>
                setUpdateFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Message Content
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide exact details for attendees..."
              value={updateFormData.message}
              onChange={(e) =>
                setUpdateFormData((prev) => ({ ...prev, message: e.target.value }))
              }
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="urgentCheck"
              checked={updateFormData.priority === 'urgent'}
              onChange={(e) =>
                setUpdateFormData((prev) => ({
                  ...prev,
                  priority: e.target.checked ? 'urgent' : 'normal'
                }))
              }
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="urgentCheck" className="text-xs font-semibold text-rose-600">
              Mark as Urgent Announcement
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsUpdateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isPostingUpdate}
              icon={Send}
            >
              Publish to Timeline
            </Button>
          </div>
        </form>
      </Modal>

      {/* Leave Feedback Modal (Feature 1) */}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        title="Event Feedback & Certificate Unlock"
        size="md"
      >
        <form onSubmit={handleSubmitFeedback} className="space-y-4">
          <p className="text-xs text-slate-500">
            Submit your star rating and feedback to unlock your official verified certificate for{' '}
            <strong className="text-slate-900 dark:text-white">{event.title}</strong>.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => {
                const filled = (hoverRating || rating) >= s;
                return (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(s)}
                    className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        filled
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  </button>
                );
              })}
              <span className="ml-2 text-xs font-bold text-amber-500">
                {rating} Stars
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Your Review & Comments
            </label>
            <textarea
              rows={4}
              required
              placeholder="What did you learn? What can be improved?"
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsFeedbackModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingFeedback}
              icon={Award}
            >
              Submit & Unlock Certificate
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal for HOD & Principal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={reviewAction === 'approve' ? 'Sanction Event Proposal' : 'Reject Event Proposal'}
      >
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            You are reviewing: <strong className="text-slate-900 dark:text-white">{event.title}</strong>
          </p>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Official Comments / Remarks
            </label>
            <textarea
              rows={3}
              placeholder="e.g., Agenda verified, venue approved, budget sanctioned..."
              value={reviewRemarks}
              onChange={(e) => setReviewRemarks(e.target.value)}
              className="w-full rounded-xl text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="ghost" size="sm" onClick={() => setIsReviewModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'danger'}
              size="sm"
              isLoading={isSubmittingReview}
              onClick={handleConfirmReview}
            >
              Confirm {reviewAction === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Dynamic Registration Checkout Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title={`Register for ${event.title}`}
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeRegistration(regCustomResponses);
          }}
          className="space-y-4"
        >
          <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200">
            Please fill in the required participant questions configured for this{' '}
            <strong>{event.template?.name || 'event'}</strong>.
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {registrationFields.map((field) => (
              <div key={field.name} className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase font-mono">{field.type}</span>
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    rows={2}
                    required={field.required}
                    placeholder={field.placeholder}
                    value={regCustomResponses[field.name] || ''}
                    onChange={(e) =>
                      setRegCustomResponses({
                        ...regCustomResponses,
                        [field.name]: e.target.value
                      })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                ) : field.type === 'select' ? (
                  <select
                    required={field.required}
                    value={regCustomResponses[field.name] || ''}
                    onChange={(e) =>
                      setRegCustomResponses({
                        ...regCustomResponses,
                        [field.name]: e.target.value
                      })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose {field.label} --</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="space-y-1.5 pt-1">
                    {field.options?.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <input
                          type="radio"
                          name={field.name}
                          required={field.required}
                          value={opt}
                          checked={regCustomResponses[field.name] === opt}
                          onChange={(e) =>
                            setRegCustomResponses({
                              ...regCustomResponses,
                              [field.name]: e.target.value
                            })
                          }
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                    <input
                      type="checkbox"
                      checked={Boolean(regCustomResponses[field.name])}
                      onChange={(e) =>
                        setRegCustomResponses({
                          ...regCustomResponses,
                          [field.name]: e.target.checked
                        })
                      }
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{field.description || field.placeholder || 'Yes / Confirm'}</span>
                  </label>
                ) : (
                  <input
                    type={
                      field.type === 'number'
                        ? 'number'
                        : field.type === 'url'
                        ? 'url'
                        : field.type === 'date'
                        ? 'date'
                        : 'text'
                    }
                    required={field.required}
                    placeholder={field.placeholder}
                    value={regCustomResponses[field.name] || ''}
                    onChange={(e) =>
                      setRegCustomResponses({
                        ...regCustomResponses,
                        [field.name]: e.target.value
                      })
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                )}
                {field.description && field.type !== 'checkbox' && (
                  <p className="text-[11px] text-slate-400">{field.description}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsRegisterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isRegistering}
              icon={CheckCircle2}
            >
              Confirm Registration
            </Button>
          </div>
        </form>
      </Modal>

      {/* Registration Success Ticket Modal */}
      <Modal
        isOpen={!!registeredTicket}
        onClose={() => setRegisteredTicket(null)}
        title="Registration Confirmed! 🎉"
        size="md"
      >
        {registeredTicket && (
          <div className="space-y-5 text-center">
            <div className="p-3 bg-white rounded-2xl border-2 border-indigo-500/20 shadow-soft inline-block">
              <img
                src={registeredTicket.qrCodeDataUrl}
                alt="Your QR Pass"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Pass Code</p>
              <p className="font-mono text-base font-extrabold text-indigo-900 dark:text-indigo-300 tracking-wider">
                {registeredTicket.ticketCode}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your entry pass is saved to your account. Present this QR code at the venue.
              </p>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Link to="/my-tickets">
                <Button size="sm" variant="primary">
                  View in My Passes
                </Button>
              </Link>
              <Button size="sm" variant="secondary" onClick={() => setRegisteredTicket(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EventDetailPage;
