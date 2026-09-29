import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  DollarSign,
  AlertCircle,
  Eye,
  FileCheck2,
  Users
} from 'lucide-react';
import {
  fetchPendingApprovals,
  approveHod,
  approvePrincipal
} from '../../features/events/eventSlice';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Skeleton from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

const ApprovalsPage = () => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const { pendingApprovals, isLoading } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchPendingApprovals());
  }, [dispatch]);

  const handleOpenReviewModal = (evt, action) => {
    setSelectedEvent(evt);
    setReviewAction(action);
    setRemarks('');
  };

  const handleConfirmReview = async () => {
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      if (user.role === 'hod' || (user.role === 'admin' && selectedEvent.status === 'pending_hod')) {
        await dispatch(
          approveHod({
            id: selectedEvent._id,
            action: reviewAction,
            remarks
          })
        ).unwrap();
        addToast(
          reviewAction === 'approve'
            ? 'Event approved by HOD and sent to Principal!'
            : 'Event proposal rejected.',
          reviewAction === 'approve' ? 'success' : 'error'
        );
      } else if (
        user.role === 'principal' ||
        (user.role === 'admin' && selectedEvent.status === 'pending_principal')
      ) {
        await dispatch(
          approvePrincipal({
            id: selectedEvent._id,
            action: reviewAction,
            remarks
          })
        ).unwrap();
        addToast(
          reviewAction === 'approve'
            ? 'Event sanctioned by Principal and published!'
            : 'Event proposal rejected.',
          reviewAction === 'approve' ? 'success' : 'error'
        );
      }

      setSelectedEvent(null);
      dispatch(fetchPendingApprovals());
    } catch (err) {
      addToast(err || 'Review submission failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isHod = user?.role === 'hod';
  const isPrincipal = user?.role === 'principal';

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
            Governance & Approval Workflow
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <span>
            {isHod
              ? 'HOD Department Approvals'
              : isPrincipal
              ? 'Principal Executive Sanctions'
              : 'Institutional Approvals Queue'}
          </span>
          <Badge variant={user?.role} size="sm">
            {pendingApprovals.length} Pending
          </Badge>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isHod &&
            `Review event proposals submitted by student organizers in ${user.department}.`}
          {isPrincipal &&
            'Review HOD-approved event proposals and authorize campus-wide publishing.'}
          {user?.role === 'admin' &&
            'Administrative review across all departmental and institutional proposal queues.'}
        </p>
      </div>

      {/* Approvals List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-3"
            >
              <Skeleton className="w-1/3 h-6" />
              <Skeleton className="w-full h-12" />
            </div>
          ))}
        </div>
      ) : pendingApprovals.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 mb-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Queue Clear! No Pending Approvals
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            All submitted proposals for your role have been reviewed and processed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {pendingApprovals.map((evt) => {
              const startDate = new Date(evt.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <motion.div
                  key={evt._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft hover:shadow-soft-lg transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="primary" size="sm">
                        {evt.category}
                      </Badge>
                      <Badge variant="accent" size="sm">
                        {evt.department}
                      </Badge>
                      <Badge
                        variant={evt.status === 'pending_hod' ? 'warning' : 'primary'}
                        size="sm"
                        dot
                      >
                        {evt.status === 'pending_hod'
                          ? 'Awaiting HOD'
                          : 'Awaiting Principal'}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {evt.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-3xl">
                      {evt.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-500" />
                        Organizer: <strong className="text-slate-700 dark:text-slate-300">{evt.organizer?.name}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {startDate}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-500" />
                        {evt.venueLocation}
                      </span>
                      {evt.budget?.estimated > 0 && (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <DollarSign className="w-3.5 h-3.5" />
                          Budget: ${evt.budget.estimated}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
                    <Link to={`/events/${evt._id}`}>
                      <Button variant="ghost" size="sm" icon={Eye}>
                        Inspect
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => handleOpenReviewModal(evt, 'approve')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      onClick={() => handleOpenReviewModal(evt, 'reject')}
                    >
                      Reject
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={reviewAction === 'approve' ? 'Sanction Event Proposal' : 'Reject Event Proposal'}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">Proposal</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {selectedEvent.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Department: {selectedEvent.department} • Organizer: {selectedEvent.organizer?.name}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Official Review Notes & Remarks
              </label>
              <textarea
                rows={3}
                placeholder="Include feedback or conditions for sanctioning..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full rounded-xl text-sm p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedEvent(null)}>
                Cancel
              </Button>
              <Button
                variant={reviewAction === 'approve' ? 'primary' : 'danger'}
                size="sm"
                isLoading={isSubmitting}
                onClick={handleConfirmReview}
              >
                Confirm {reviewAction === 'approve' ? 'Sanction' : 'Rejection'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ApprovalsPage;
