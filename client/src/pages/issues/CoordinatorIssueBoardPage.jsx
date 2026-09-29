import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  UserCheck,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldAlert,
  Flame,
  Camera,
  Layers,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

const STAGES = ['Reported', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Confirmed'];
const CATEGORIES = ['All', 'food', 'seating', 'venue', 'audio-visual', 'cleanliness', 'other'];

const CoordinatorIssueBoardPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [issues, setIssues] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStage, setSelectedStage] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Transition stage modal
  const [targetIssue, setTargetIssue] = useState(null);
  const [nextStage, setNextStage] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);

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

  const fetchIssuesData = async () => {
    if (!selectedEventId) return;
    setIsLoading(true);
    try {
      const res = await api.get(`/issues/event/${selectedEventId}`, {
        params: {
          category: selectedCategory,
          stage: selectedStage
        }
      });
      setIssues(res.data.issues || []);
      setMetrics(res.data.metrics || null);
    } catch (err) {
      console.error('Fetch issues error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuesData();
  }, [selectedEventId, selectedCategory, selectedStage]);

  const handleOpenTransition = (issue, stage) => {
    setTargetIssue(issue);
    setNextStage(stage);
    setTransitionNotes('');
  };

  const handleConfirmTransition = async (e) => {
    e.preventDefault();
    if (!targetIssue || !nextStage) return;

    setIsUpdatingStage(true);
    try {
      const res = await api.patch(`/issues/${targetIssue._id}/stage`, {
        stage: nextStage,
        notes: transitionNotes
      });
      addToast(res.data.message || `Issue advanced to ${nextStage}!`, 'success');
      setTargetIssue(null);
      fetchIssuesData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update stage.', 'error');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const getSlaBadge = (deadline, isEscalated, stage) => {
    if (['Resolved', 'Confirmed'].includes(stage)) {
      return (
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
          SLA Met
        </span>
      );
    }

    if (isEscalated) {
      return (
        <span className="text-[10px] font-extrabold uppercase text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-md animate-pulse flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> SLA Breached (Admin Escalated)
        </span>
      );
    }

    const diffMinutes = Math.round((new Date(deadline) - new Date()) / (1000 * 60));
    if (diffMinutes <= 0) {
      return (
        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
          Overdue
        </span>
      );
    }

    return (
      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
        <Clock className="w-3 h-3 text-indigo-500" /> {diffMinutes}m SLA window
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">
              Real-Time Incident & Facility Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            <span>Coordinator Issue & SLA Board</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor attendee facility reports, track stage SLAs, escalate bottlenecks, and coordinate resolution teams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/issues/my">
            <Button size="sm" variant="secondary">
              Switch to Student View
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            icon={RefreshCw}
            onClick={fetchIssuesData}
            isLoading={isLoading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Reports</span>
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white block mt-1">
              {metrics.total}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900 shadow-soft">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase">
              New Reported
            </span>
            <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 block mt-1">
              {metrics.reported}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900 shadow-soft">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase">
              Active / In Progress
            </span>
            <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 block mt-1">
              {metrics.inProgress}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900 shadow-soft">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              Resolved
            </span>
            <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 block mt-1">
              {metrics.resolved}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900 shadow-soft">
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> SLA Escalated
            </span>
            <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 block mt-1">
              {metrics.escalated}
            </span>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft flex flex-wrap items-center justify-between gap-4">
        {/* Event Selector */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <label className="text-xs font-bold text-slate-500">Event:</label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          >
            {events.map((evt) => (
              <option key={evt._id} value={evt._id}>
                {evt.title} ({evt.department})
              </option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1">Category:</span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Stage Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Stage:</span>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="text-xs font-semibold py-1.5 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          >
            <option value="All">All Stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Issues Table / Cards */}
      {issues.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Active Issues in this Filter
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            All facilities and attendee requests are running smoothly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <motion.div
              key={issue._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border-2 shadow-soft space-y-4 transition-all ${
                issue.isEscalated
                  ? 'border-rose-500/80 bg-rose-50/20 dark:bg-rose-950/10'
                  : issue.priority === 'high' || issue.priority === 'critical'
                  ? 'border-amber-500/60'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {issue.category}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                        issue.priority === 'high' || issue.priority === 'critical'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {issue.priority} Priority
                    </span>

                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60">
                      Stage: {issue.stage}
                    </span>

                    {getSlaBadge(issue.slaDeadline, issue.isEscalated, issue.stage)}
                  </div>

                  <p className="text-sm font-semibold text-slate-900 dark:text-white pt-1">
                    {issue.description}
                  </p>
                </div>

                {/* Reporter Tag */}
                <div className="text-right text-xs text-slate-500 shrink-0">
                  <span className="block font-bold text-slate-800 dark:text-slate-200">
                    {issue.reportedBy?.name || 'Student'}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {issue.reportedBy?.rollNo || issue.reportedBy?.department}
                  </span>
                </div>
              </div>

              {/* Photo preview if present */}
              {issue.photoUrl && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 w-fit">
                  <img
                    src={issue.photoUrl}
                    alt="Issue Evidence"
                    className="w-14 h-14 rounded-lg object-cover border"
                  />
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> Photo Attached
                  </span>
                </div>
              )}

              {/* Stage Progress & Action Stepper */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <span className="font-semibold">Workflow Actions:</span>
                  {issue.stage === 'Reported' && (
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => handleOpenTransition(issue, 'Acknowledged')}
                    >
                      Acknowledge Issue &rarr;
                    </Button>
                  )}
                  {issue.stage === 'Acknowledged' && (
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => handleOpenTransition(issue, 'Assigned')}
                    >
                      Assign to Staff &rarr;
                    </Button>
                  )}
                  {issue.stage === 'Assigned' && (
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => handleOpenTransition(issue, 'In Progress')}
                    >
                      Start Work (In Progress) &rarr;
                    </Button>
                  )}
                  {issue.stage === 'In Progress' && (
                    <Button
                      size="xs"
                      variant="primary"
                      className="bg-emerald-600 hover:bg-emerald-500"
                      onClick={() => handleOpenTransition(issue, 'Resolved')}
                    >
                      Mark Resolved &rarr;
                    </Button>
                  )}
                  {issue.stage === 'Resolved' && (
                    <Button
                      size="xs"
                      variant="secondary"
                      onClick={() => handleOpenTransition(issue, 'Confirmed')}
                    >
                      Confirm Closed &rarr;
                    </Button>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  Reported on {new Date(issue.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {issue.reopenCount > 0 && (
                    <span className="ml-2 font-bold text-amber-600">
                      (Reopened {issue.reopenCount}x)
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stage Transition Modal */}
      <Modal
        isOpen={!!targetIssue}
        onClose={() => setTargetIssue(null)}
        title={`Advance Issue to: ${nextStage}`}
        size="md"
      >
        {targetIssue && (
          <form onSubmit={handleConfirmTransition} className="space-y-4">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                Target Issue
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-0.5">
                {targetIssue.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Coordinator Notes / Instructions
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Assigned housekeeping staff to clean aisle 4..."
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTargetIssue(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdatingStage}
              >
                Confirm Stage Transition
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default CoordinatorIssueBoardPage;
