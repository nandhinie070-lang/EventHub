import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  MapPin,
  Users,
  ShieldCheck,
  AlertCircle,
  AlertTriangle,
  Layers,
  Sliders,
  Clock
} from 'lucide-react';
import api from '../../services/api';
import { createEvent } from '../../features/events/eventSlice';
import Stepper from '../../components/common/Stepper';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';

const CreateEventPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { user } = useSelector((state) => state.auth);
  const collegeConfig = useSelector((state) => state.auth.collegeConfig);
  const { isLoading, error } = useSelector((state) => state.events);

  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState('');

  // Feature 1: Dynamic Templates State
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [customFieldResponses, setCustomFieldResponses] = useState({});

  // Feature 3: Venue Clash State
  const [venueConflict, setVenueConflict] = useState(null);
  const [isCheckingClash, setIsCheckingClash] = useState(false);
  const [clashStatus, setClashStatus] = useState(null); // 'available' | 'clash' | null

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await api.get('/event-templates');
        setTemplates(res.data.templates || []);
      } catch (err) {
        console.error('Failed to load templates:', err);
      }
    };
    fetchTemplates();
  }, []);

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setSelectedTemplate(null);
      setCustomFieldResponses({});
      return;
    }
    const tmpl = templates.find((t) => t._id === templateId);
    setSelectedTemplate(tmpl);
    if (tmpl) {
      if (tmpl.category) {
        setFormData((prev) => ({ ...prev, category: tmpl.category }));
      }
    }
  };

  const [formData, setFormData] = useState({
    title: '',
    category: 'Technical',
    department: user?.department || 'Computer Science & Engineering',
    description: '',
    bannerUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    venueMode: 'offline',
    venueLocation: '',
    capacity: 100,
    isPaid: false,
    fee: 0,
    allowedUserTypes: ['internal', 'external'],
    tags: 'Innovation, Campus',
    estimatedBudget: 500,
    budgetBreakdown: 'Logistics, sound equipment, certificates, and refreshments.'
  });

  const steps = [
    { title: 'General Info', subtitle: 'Event title & summary' },
    { title: 'Date & Venue', subtitle: 'Schedule & location' },
    { title: 'Capacity & Fees', subtitle: 'Seats & entry pricing' },
    { title: 'Budget & Review', subtitle: 'HOD submission' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setFormError('');
  };

  const handleCheckVenueClash = async () => {
    if (!formData.venueLocation || !formData.startDate || !formData.endDate) {
      setFormError(
        'Please enter venue location, start date, and end date to check availability.'
      );
      return;
    }
    setIsCheckingClash(true);
    setVenueConflict(null);
    setClashStatus(null);
    try {
      const res = await api.post('/events/check-venue-clash', {
        venueLocation: formData.venueLocation,
        venueMode: formData.venueMode,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString()
      });

      if (res.data.hasClash) {
        setVenueConflict(res.data.conflict);
        setClashStatus('clash');
        addToast(res.data.message, 'error');
      } else {
        setClashStatus('available');
        addToast('Venue is free & available for booking!', 'success');
      }
    } catch (err) {
      console.error('Clash check failed:', err);
    } finally {
      setIsCheckingClash(false);
    }
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.title || !formData.description) {
        setFormError('Please enter event title and description.');
        return;
      }
      // Validate required event-scoped template fields
      if (selectedTemplate && Array.isArray(selectedTemplate.customFields)) {
        for (const field of selectedTemplate.customFields) {
          if (field.target === 'event' || field.target === 'both') {
            if (field.required) {
              const val = customFieldResponses[field.name];
              if (val === undefined || val === null || val === '') {
                setFormError(`Template field "${field.label}" is required.`);
                return;
              }
            }
          }
        }
      }
    } else if (currentStep === 2) {
      if (
        !formData.startDate ||
        !formData.endDate ||
        !formData.registrationDeadline ||
        !formData.venueLocation
      ) {
        setFormError('Please complete all schedule dates and venue location.');
        return;
      }
    } else if (currentStep === 3) {
      if (formData.capacity <= 0) {
        setFormError('Capacity must be at least 1.');
        return;
      }
    }

    setFormError('');
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setFormError('');
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title: formData.title,
      category: formData.category,
      department: formData.department,
      description: formData.description,
      bannerUrl: formData.bannerUrl,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      registrationDeadline: new Date(formData.registrationDeadline).toISOString(),
      venueMode: formData.venueMode,
      venueLocation: formData.venueLocation,
      capacity: Number(formData.capacity),
      isPaid: Boolean(formData.isPaid),
      fee: formData.isPaid ? Number(formData.fee) : 0,
      allowedUserTypes: formData.allowedUserTypes,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      budget: {
        estimated: Number(formData.estimatedBudget),
        breakdown: formData.budgetBreakdown
      },
      template: selectedTemplateId || undefined,
      customFieldResponses
    };

    try {
      const res = await api.post('/events', payload);
      addToast(res.data.message || 'Event proposal submitted!', 'success');
      navigate(`/events/${res.data.event._id}`);
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.conflict) {
        setVenueConflict(err.response.data.conflict);
        setClashStatus('clash');
        setFormError(err.response.data.message);
        setCurrentStep(2); // Jump to venue step to show clash
      } else {
        setFormError(
          err.response?.data?.message || 'Failed to submit event proposal.'
        );
      }
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Propose Campus Event
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Complete the four-step proposal. It will be routed directly to your department HOD.
        </p>
      </div>

      {/* Stepper Bar */}
      <Stepper steps={steps} currentStep={currentStep} onStepClick={setCurrentStep} />

      {/* Error alert */}
      {(formError || error) && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{formError || error}</span>
        </div>
      )}

      {/* Form Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
        <form onSubmit={handleSubmit}>
          {/* STEP 1: GENERAL INFO */}
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* Feature 1: Dynamic Template Selector */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Dynamic Event Template (Preset Schema)</span>
                  </label>
                  {selectedTemplate && (
                    <Badge variant="primary" size="sm">
                      {selectedTemplate.customFields?.length || 0} Dynamic Custom Fields Active
                    </Badge>
                  )}
                </div>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full rounded-xl text-xs font-semibold py-2.5 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-indigo-200 dark:border-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">-- Custom Blank Event (No Template) --</option>
                  {templates.map((tmpl) => (
                    <option key={tmpl._id} value={tmpl._id}>
                      {tmpl.name} ({tmpl.category}) — {tmpl.customFields?.length || 0} Custom Fields
                    </option>
                  ))}
                </select>
                {selectedTemplate && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {selectedTemplate.description}
                  </p>
                )}
              </div>

              <Input
                label="Event Title"
                name="title"
                placeholder="e.g. Apex AI & Cloud Summit 2026"
                required
                value={formData.title}
                onChange={handleChange}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full rounded-xl text-sm py-2.5 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Hackathon">Hackathon</option>
                    <option value="Sports">Sports</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Host Department <span className="text-rose-500">*</span>
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
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Event Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  placeholder="Detail the objectives, guest speakers, key takeaways, and prerequisites..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full rounded-xl text-sm p-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <Input
                label="Banner Image URL"
                name="bannerUrl"
                type="url"
                placeholder="https://images.unsplash.com/..."
                helperText="Leave default or provide a high-resolution Unsplash image link"
                value={formData.bannerUrl}
                onChange={handleChange}
              />

              {/* Dynamic Event-Scoped Custom Fields */}
              {selectedTemplate &&
                selectedTemplate.customFields?.filter(
                  (f) => f.target === 'event' || f.target === 'both'
                ).length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span>Template Custom Event Setup Fields</span>
                    </div>
                    {selectedTemplate.customFields
                      .filter((f) => f.target === 'event' || f.target === 'both')
                      .map((field) => (
                        <div key={field.name} className="space-y-1">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>
                              {field.label}{' '}
                              {field.required && <span className="text-rose-500">*</span>}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono">
                              {field.type}
                            </span>
                          </label>

                          {field.type === 'textarea' ? (
                            <textarea
                              rows={2}
                              required={field.required}
                              placeholder={field.placeholder}
                              value={customFieldResponses[field.name] || ''}
                              onChange={(e) =>
                                setCustomFieldResponses({
                                  ...customFieldResponses,
                                  [field.name]: e.target.value
                                })
                              }
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          ) : field.type === 'select' ? (
                            <select
                              required={field.required}
                              value={customFieldResponses[field.name] || ''}
                              onChange={(e) =>
                                setCustomFieldResponses({
                                  ...customFieldResponses,
                                  [field.name]: e.target.value
                                })
                              }
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            >
                              <option value="">-- Select Option --</option>
                              {field.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={
                                field.type === 'number'
                                  ? 'number'
                                  : field.type === 'url'
                                  ? 'url'
                                  : 'text'
                              }
                              required={field.required}
                              placeholder={field.placeholder}
                              value={customFieldResponses[field.name] || ''}
                              onChange={(e) =>
                                setCustomFieldResponses({
                                  ...customFieldResponses,
                                  [field.name]: e.target.value
                                })
                              }
                              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                            />
                          )}
                          {field.description && (
                            <p className="text-[11px] text-slate-400">
                              {field.description}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                )}
            </motion.div>
          )}

          {/* STEP 2: DATE & VENUE */}
          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Start Date & Time"
                  name="startDate"
                  type="datetime-local"
                  required
                  value={formData.startDate}
                  onChange={handleChange}
                />
                <Input
                  label="End Date & Time"
                  name="endDate"
                  type="datetime-local"
                  required
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Registration Deadline"
                name="registrationDeadline"
                type="date"
                required
                value={formData.registrationDeadline}
                onChange={handleChange}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Venue Mode <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="venueMode"
                    value={formData.venueMode}
                    onChange={handleChange}
                    className="w-full rounded-xl text-sm py-2.5 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="offline">In-Person (On Campus)</option>
                    <option value="online">Virtual (Zoom / Meet)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <Input
                  label="Venue Location / Meeting Link"
                  name="venueLocation"
                  placeholder="e.g. Main Auditorium or Zoom Link"
                  required
                  value={formData.venueLocation}
                  onChange={handleChange}
                />
              </div>

              {/* Feature 3: Venue Clash Detection & Verification */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={CheckCircle2}
                    isLoading={isCheckingClash}
                    onClick={handleCheckVenueClash}
                  >
                    Check Venue Availability
                  </Button>

                  {clashStatus === 'available' && (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Venue Slot is Free & Confirmed</span>
                    </span>
                  )}
                </div>

                {venueConflict && (
                  <div className="mt-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-700 dark:text-rose-300">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Venue Clash Detected! Booking Blocked for this Slot</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      The location <strong>"{venueConflict.venueLocation}"</strong> has an overlapping booking:
                    </p>
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 text-xs space-y-1">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {venueConflict.title}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Organized by {venueConflict.organizerName} • {venueConflict.department}
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                        Slot: {new Date(venueConflict.startDate).toLocaleString()} —{' '}
                        {new Date(venueConflict.endDate).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-[11px] text-rose-600 italic">
                      Please alter the schedule dates or choose an alternate auditorium/hall to proceed.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: CAPACITY & FEES */}
          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Participant Capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  required
                  value={formData.capacity}
                  onChange={handleChange}
                />

                <Input
                  label="Tags (Comma-separated)"
                  name="tags"
                  placeholder="AI, Cloud, Python, Career"
                  value={formData.tags}
                  onChange={handleChange}
                />
              </div>

              {/* Paid Event Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Charge Entry Ticket Fee
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Enable if attendees are charged a registration fee.
                  </p>
                </div>
                <input
                  type="checkbox"
                  name="isPaid"
                  checked={formData.isPaid}
                  onChange={handleChange}
                  className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                />
              </div>

              {formData.isPaid && (
                <Input
                  label="Ticket Fee (USD $)"
                  name="fee"
                  type="number"
                  min="1"
                  placeholder="e.g. 15"
                  required
                  value={formData.fee}
                  onChange={handleChange}
                />
              )}
            </motion.div>
          )}

          {/* STEP 4: BUDGET & REVIEW */}
          {currentStep === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Estimated Budget Request (USD $)"
                  name="estimatedBudget"
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={handleChange}
                />

                <Input
                  label="Budget Allocation Summary"
                  name="budgetBreakdown"
                  placeholder="e.g. Venue audio $200, Guest speaker $300"
                  value={formData.budgetBreakdown}
                  onChange={handleChange}
                />
              </div>

              {/* Review Summary Box */}
              <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Proposal Summary
                </h4>
                <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                  <p>
                    <strong>Title:</strong> {formData.title}
                  </p>
                  <p>
                    <strong>Category & Dept:</strong> {formData.category} • {formData.department}
                  </p>
                  <p>
                    <strong>Schedule:</strong> {formData.startDate || 'TBD'} to{' '}
                    {formData.endDate || 'TBD'}
                  </p>
                  <p>
                    <strong>Venue:</strong> {formData.venueLocation} ({formData.venueMode})
                  </p>
                  <p>
                    <strong>Capacity:</strong> {formData.capacity} attendees |{' '}
                    {formData.isPaid ? `$${formData.fee}` : 'Free'}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Upon submission, this event will be routed to your Department HOD for primary review, followed by the Principal for final institutional sanction.
                </span>
              </div>
            </motion.div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                icon={ArrowLeft}
                onClick={handlePrev}
              >
                Previous Step
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                size="md"
                icon={ArrowRight}
                iconPosition="right"
                onClick={handleNext}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                size="md"
                isLoading={isLoading}
                icon={CheckCircle2}
                iconPosition="right"
              >
                Submit Proposal to HOD
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage;
