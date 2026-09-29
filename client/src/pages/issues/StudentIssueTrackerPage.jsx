import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  RefreshCw,
  Camera,
  RotateCcw,
  Check,
  Building,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

const STAGES = ['Reported', 'Acknowledged', 'Assigned', 'In Progress', 'Resolved', 'Confirmed'];
const CATEGORIES = ['food', 'seating', 'venue', 'audio-visual', 'cleanliness', 'other'];

const StudentIssueTrackerPage = () => {
  const { user } = useSelector((state) => state.auth);
  const { addToast } = useToast();

  const [issues, setIssues] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [reportData, setReportData] = useState({
    category: 'food',
    description: '',
    photoUrl: '',
    priority: 'medium'
  });
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Reopen modal
  const [reopenTarget, setReopenTarget] = useState(null);
  const [reopenReason, setReopenReason] = useState('');
  const [isSubmittingReopen, setIsSubmittingReopen] = useState(false);

  const fetchMyIssues = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/issues/my');
      setIssues(res.data.issues || []);
    } catch (err) {
      console.error('Error fetching issues:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyIssues();
    const fetchEventsList = async () => {
      try {
        const res = await api.get('/events', { params: { status: 'approved' } });
        setEvents(res.data.events || []);
        if (res.data.events?.length > 0) {
          setSelectedEventId(res.data.events[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEventsList();
  }, []);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!selectedEventId || !reportData.description.trim()) {
      addToast('Please select an event and describe the issue.', 'warning');
      return;
    }

    setIsSubmittingReport(true);
    try {
      const res = await api.post(`/issues/${selectedEventId}`, reportData);
      addToast(res.data.message || 'Issue reported successfully!', 'success');
      setIsReportModalOpen(false);
      setReportData({
        category: 'food',
        description: '',
        photoUrl: '',
        priority: 'medium'
      });
      fetchMyIssues();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit report.', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenTarget) return;

    setIsSubmittingReopen(true);
    try {
      const res = await api.patch(`/issues/${reopenTarget._id}/reopen`, {
        reopenReason: reopenReason || 'Issue persists.'
      });
      addToast(res.data.message || 'Issue reopened!', 'success');
      setReopenTarget(null);
      fetchMyIssues();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to reopen issue.', 'error');
    } finally {
      setIsSubmittingReopen(false);
    }
  };

  const getStageIndex = (stage) => STAGES.indexOf(stage);

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-rose-600 dark:text-rose-400 tracking-wider">
              Student Helpdesk & Grievance SLA
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400" />
            <span>My Reported Issues & SLA Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track real-time resolution stages and SLA countdowns for your reported event facility issues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user && ['organizer', 'admin', 'principal'].includes(user.role) && (
            <Link to="/issues/board">
              <Button size="sm" variant="secondary">
                Coordinator Board
              </Button>
            </Link>
          )}

          <Button
            size="sm"
            variant="primary"
            icon={Plus}
            onClick={() => setIsReportModalOpen(true)}
          >
            Report an Issue
          </Button>
        </div>
      </div>

      {/* Reported Issues List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="w-1/4 h-5 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Issues Reported
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Encountering any issues with food, seating, audio-visual, or cleanliness? Submit an incident report and our coordinators will resolve it within the SLA window.
          </p>
          <Button
            size="sm"
            variant="primary"
            className="mt-5"
            icon={Plus}
            onClick={() => setIsReportModalOpen(true)}
          >
            Report an Issue Now
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {issues.map((issue) => {
            const currentIdx = getStageIndex(issue.stage);

            return (
              <motion.div
                key={issue._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {issue.category}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                        Stage: {issue.stage}
                      </span>
                      {issue.isEscalated && (
                        <Badge variant="danger" size="sm" dot>
                          SLA Breached / Escalated to Admin
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {issue.description}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Event: <strong className="text-indigo-600 dark:text-indigo-400">{issue.event?.title}</strong>
                    </p>
                  </div>

                  {/* Actions for student */}
                  {issue.stage === 'Resolved' && (
                    <Button
                      size="xs"
                      variant="outline"
                      icon={RotateCcw}
                      onClick={() => {
                        setReopenTarget(issue);
                        setReopenReason('');
                      }}
                    >
                      Reopen Issue
                    </Button>
                  )}
                </div>

                {/* Progress Stepper Timeline */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    SLA Resolution Stages
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {STAGES.map((s, idx) => {
                      const isCompleted = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;

                      return (
                        <div
                          key={s}
                          className={`p-2.5 rounded-xl border text-center transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 text-emerald-700 dark:text-emerald-300'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="text-[10px] font-bold block">{s}</span>
                          {isCompleted && !isCurrent && (
                            <Check className="w-3 h-3 text-emerald-600 mx-auto mt-0.5" />
                          )}
                          {isCurrent && (
                            <span className="text-[9px] uppercase font-bold tracking-wider block opacity-90 mt-0.5">
                              Active
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent History Trail */}
                {issue.stageHistory?.length > 0 && (
                  <div className="text-xs text-slate-500 space-y-1">
                    <span className="font-semibold block text-slate-600 dark:text-slate-400">
                      Recent Activity:
                    </span>
                    {issue.stageHistory.slice(-2).map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className="font-bold text-indigo-600">&bull; {h.stage}:</span>
                        <span>{h.notes}</span>
                        <span className="text-slate-400 text-[10px]">
                          ({new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Report New Issue Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Event Facility or Logistics Issue"
        size="md"
      >
        <form onSubmit={handleCreateReport} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              {events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title} ({evt.department})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Category
            </label>
            <select
              value={reportData.category}
              onChange={(e) => setReportData((p) => ({ ...p, category: e.target.value }))}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 capitalize"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Issue Description
            </label>
            <textarea
              rows={3}
              required
              placeholder="Please describe the issue clearly (location, aisle, room, problem)..."
              value={reportData.description}
              onChange={(e) => setReportData((p) => ({ ...p, description: e.target.value }))}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Photo URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://example.com/photo.jpg"
              value={reportData.photoUrl}
              onChange={(e) => setReportData((p) => ({ ...p, photoUrl: e.target.value }))}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsReportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingReport}
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reopen Modal */}
      <Modal
        isOpen={!!reopenTarget}
        onClose={() => setReopenTarget(null)}
        title="Reopen Resolved Issue"
        size="md"
      >
        {reopenTarget && (
          <form onSubmit={handleReopen} className="space-y-4">
            <p className="text-xs text-slate-500">
              If the problem was not fully resolved, let the coordinators know what is still pending.
            </p>

            <textarea
              rows={3}
              required
              placeholder="Why are you reopening this issue? (e.g. problem reoccurred after 15 mins)..."
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setReopenTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                size="sm"
                isLoading={isSubmittingReopen}
              >
                Confirm Reopen
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default StudentIssueTrackerPage;
