import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  Download,
  Calendar,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Building,
  Star,
  Lock,
  MessageSquare
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Skeleton from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

const CertificatesPage = () => {
  const { user } = useSelector((state) => state.auth);
  const collegeConfig = useSelector((state) => state.auth.collegeConfig);
  const { addToast } = useToast();

  const [certificates, setCertificates] = useState([]);
  const [pendingFeedbackEvents, setPendingFeedbackEvents] = useState([]);
  const [completedEvents, setCompletedEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);

  // Feedback modal state
  const [feedbackEvent, setFeedbackEvent] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Bulk issue state for organizers
  const [selectedEventToIssue, setSelectedEventToIssue] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);

  const isStaff = user && ['organizer', 'admin', 'principal'].includes(user.role);

  const fetchCertificatesData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/certificates/my-certificates');
      setCertificates(res.data.certificates || []);
      setPendingFeedbackEvents(res.data.pendingFeedbackEvents || []);

      if (isStaff) {
        const eventsRes = await api.get('/events', { params: { status: 'approved' } });
        setCompletedEvents(eventsRes.data.events || []);
        if (eventsRes.data.events?.length > 0 && !selectedEventToIssue) {
          setSelectedEventToIssue(eventsRes.data.events[0]._id);
        }
      }
    } catch (err) {
      addToast('Failed to load certificates.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificatesData();
  }, [user]);

  const handleDownloadPDF = (certId) => {
    const url = `/api/certificates/download/${certId}`;
    window.open(url, '_blank');
  };

  const handleIssueBulkCertificates = async () => {
    if (!selectedEventToIssue) return;
    setIsIssuing(true);
    try {
      const res = await api.post(`/certificates/generate/${selectedEventToIssue}`);
      addToast(res.data.message || 'Certificates successfully generated!', 'success');
      fetchCertificatesData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Certificate generation failed.', 'error');
    } finally {
      setIsIssuing(false);
    }
  };

  const handleOpenFeedback = (evt) => {
    setFeedbackEvent(evt);
    setRating(5);
    setHoverRating(0);
    setComment('');
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackEvent) return;
    if (!comment.trim()) {
      addToast('Please enter your feedback comments.', 'warning');
      return;
    }

    setIsSubmittingFeedback(true);
    try {
      const res = await api.post(`/feedback/${feedbackEvent.eventId}`, {
        rating,
        comment: comment.trim()
      });

      addToast(res.data.message || 'Feedback submitted! Certificate unlocked.', 'success');
      setFeedbackEvent(null);
      await fetchCertificatesData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit feedback.', 'error');
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              Verifiable Academic Credentials
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Award className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Certificates of Participation</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official cryptographically verifiable certificates unlocked upon verified attendance and feedback submission.
          </p>
        </div>
      </div>

      {/* Pending Feedback / Locked Certificates Alert Banner */}
      {pendingFeedbackEvents.length > 0 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-purple-500/10 border-2 border-amber-500/30 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Certificates Locked &mdash; Attendee Feedback Required ({pendingFeedbackEvents.length})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You attended the following events! Submit a 1-minute rating and review to instantly unlock your official E-Certificate.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingFeedbackEvents.map((evt) => (
              <div
                key={evt.eventId}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {evt.eventTitle}
                  </h4>
                  <p className="text-[11px] text-slate-500">{evt.department}</p>
                </div>
                <Button
                  size="xs"
                  variant="primary"
                  icon={Star}
                  onClick={() => handleOpenFeedback(evt)}
                >
                  Rate & Unlock
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Issue Action Panel */}
      {isStaff && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-200 dark:border-indigo-800/60 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 w-full sm:w-auto flex-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Issue Certificates to Checked-in Attendees
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Only attendees with marked attendance and submitted feedback will be awarded signed credentials.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedEventToIssue}
              onChange={(e) => setSelectedEventToIssue(e.target.value)}
              className="py-2 px-3 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {completedEvents.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              isLoading={isIssuing}
              onClick={handleIssueBulkCertificates}
              icon={Award}
            >
              Issue Credentials
            </Button>
          </div>
        </div>
      )}

      {/* Certificates Grid */}
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
      ) : certificates.length === 0 && pendingFeedbackEvents.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 mb-4">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Certificates Issued Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Certificates are automatically unlocked once event gate attendance is verified and event feedback is submitted.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence>
            {certificates.map((cert, idx) => {
              const issueDate = new Date(cert.issueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <motion.div
                  key={cert._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3 }}
                  className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-amber-500/20 shadow-soft hover:shadow-soft-lg transition-all p-6 relative overflow-hidden flex flex-col justify-between group"
                >
                  {/* Decorative golden ribbon glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 blur-2xl pointer-events-none rounded-full" />

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                          <Award className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-extrabold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                          Verified Credential
                        </span>
                      </div>
                      <Badge variant="success" size="sm" dot>
                        Authentic
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                      {cert.eventTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Awarded to <strong className="text-slate-800 dark:text-slate-200">{cert.recipientName}</strong>
                    </p>

                    <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Issued Date:</span>
                        <span className="font-semibold">{issueDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Credential ID:</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {cert.certificateId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Verification Hash:</span>
                        <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                          {cert.verificationHash}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      icon={ShieldCheck}
                      onClick={() => setSelectedCert(cert)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={Download}
                      onClick={() => handleDownloadPDF(cert.certificateId)}
                    >
                      Download PDF
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Interactive Feedback & Rating Modal */}
      <Modal
        isOpen={!!feedbackEvent}
        onClose={() => setFeedbackEvent(null)}
        title="Submit Event Feedback & Unlock Certificate"
        size="md"
      >
        {feedbackEvent && (
          <form onSubmit={handleSubmitFeedback} className="space-y-5">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Attended Event
              </span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {feedbackEvent.eventTitle}
              </h4>
            </div>

            {/* Interactive Star Rating */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                How would you rate this event? (1 - 5 Stars)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300 dark:text-slate-600'
                        }`}
                      />
                    </button>
                  );
                })}
                <span className="ml-2 text-xs font-bold text-amber-500">
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Your Feedback & Key Takeaways
              </label>
              <textarea
                rows={4}
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you enjoy about the sessions, speakers, and organization? Any suggestions for improvement?"
                className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFeedbackEvent(null)}
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
        )}
      </Modal>

      {/* Credential Inspection Modal */}
      <Modal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        title="Official Academic Credential"
        size="md"
      >
        {selectedCert && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
              <Award className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest text-amber-700 dark:text-amber-400">
                Apex Institute of Technology
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                Certificate of Participation
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Presented to <strong className="text-slate-800 dark:text-slate-200">{selectedCert.recipientName}</strong> for successful completion of{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">{selectedCert.eventTitle}</strong>.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Certificate ID:</span>
                <span className="font-mono font-bold">{selectedCert.certificateId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cryptographic Hash:</span>
                <span className="font-mono text-[11px] text-slate-500">{selectedCert.verificationHash}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registry Status:</span>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Valid & Verifiable
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <Button
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => handleDownloadPDF(selectedCert.certificateId)}
              >
                Download Official PDF
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSelectedCert(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CertificatesPage;
