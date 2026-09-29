import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Settings,
  HelpCircle,
  FileText,
  Sliders,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  X
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Skeleton from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

const FIELD_TYPES = [
  { value: 'text', label: 'Single-line Text' },
  { value: 'textarea', label: 'Multi-line Paragraph' },
  { value: 'number', label: 'Numeric Value' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'radio', label: 'Radio Choices' },
  { value: 'checkbox', label: 'Checkbox (Yes/No)' },
  { value: 'date', label: 'Date Selector' },
  { value: 'url', label: 'Web / Portfolio URL' }
];

const CATEGORIES = [
  'Technical',
  'Cultural',
  'Sports',
  'Workshop',
  'Seminar',
  'Hackathon',
  'Other'
];

const EventTemplatesPage = () => {
  const { addToast } = useToast();

  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'Technical',
    description: '',
    customFields: []
  });

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/event-templates');
      setTemplates(res.data.templates || []);
    } catch (err) {
      addToast('Failed to load event templates.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'Technical',
      description: '',
      customFields: [
        {
          name: 'team_name',
          label: 'Team / Group Name',
          type: 'text',
          required: true,
          target: 'registration',
          options: [],
          placeholder: 'e.g. Apex Innovators',
          description: 'Name of the attendee team'
        }
      ]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tmpl) => {
    setEditingTemplate(tmpl);
    setFormData({
      name: tmpl.name,
      category: tmpl.category,
      description: tmpl.description,
      customFields: (tmpl.customFields || []).map((f) => ({
        ...f,
        options: Array.isArray(f.options) ? f.options : []
      }))
    });
    setIsModalOpen(true);
  };

  const handleAddField = () => {
    const newField = {
      name: `field_${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      target: 'registration',
      options: [],
      placeholder: '',
      description: ''
    };
    setFormData((prev) => ({
      ...prev,
      customFields: [...prev.customFields, newField]
    }));
  };

  const handleRemoveField = (index) => {
    setFormData((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
    }));
  };

  const handleFieldChange = (index, fieldKey, val) => {
    setFormData((prev) => {
      const updated = [...prev.customFields];
      updated[index] = { ...updated[index], [fieldKey]: val };

      // Auto update name key if label changes and name was generated
      if (fieldKey === 'label' && (!updated[index].name || updated[index].name.startsWith('field_'))) {
        updated[index].name = val.toLowerCase().replace(/[^a-z0-9]/g, '_');
      }
      return { ...prev, customFields: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      addToast('Please provide template name and description.', 'error');
      return;
    }

    // Validate fields
    for (let i = 0; i < formData.customFields.length; i++) {
      const f = formData.customFields[i];
      if (!f.label.trim()) {
        addToast(`Field #${i + 1} must have a label.`, 'error');
        return;
      }
    }

    setIsSaving(true);
    try {
      if (editingTemplate) {
        await api.put(`/event-templates/${editingTemplate._id}`, formData);
        addToast('Event template updated successfully.', 'success');
      } else {
        await api.post('/event-templates', formData);
        addToast('Event template created successfully.', 'success');
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to save template.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTemplate = async (tmpl) => {
    if (!window.confirm(`Are you sure you want to delete template "${tmpl.name}"?`)) return;
    try {
      await api.delete(`/event-templates/${tmpl._id}`);
      addToast('Template deleted successfully.', 'success');
      fetchTemplates();
    } catch (err) {
      addToast('Failed to delete template.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              Governance & Automation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Dynamic Event Templates</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Define custom field schemas for Hackathons, Workshops, and Seminars. The creation form and registration checkout dynamically render these fields.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleOpenCreateModal}
          className="shadow-glow shrink-0"
        >
          Create Template
        </Button>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Layers className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Templates Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
            Get started by creating event templates with dynamic custom questions for attendees and organizers.
          </p>
          <Button variant="primary" icon={Plus} onClick={handleOpenCreateModal}>
            Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tmpl) => (
            <motion.div
              key={tmpl._id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft flex flex-col justify-between group hover:shadow-soft-lg transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="primary" size="sm">
                    {tmpl.category}
                  </Badge>
                  <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                    {tmpl.customFields?.length || 0} Dynamic Fields
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {tmpl.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {tmpl.description}
                  </p>
                </div>

                {/* Custom Fields Preview List */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Configured Dynamic Schema
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(tmpl.customFields || []).map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              f.target === 'event' ? 'bg-amber-500' : 'bg-indigo-500'
                            }`}
                          />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {f.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] text-slate-500 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            {f.type}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                              f.target === 'event'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                            }`}
                          >
                            {f.target === 'event' ? 'Organizer' : 'Attendee'}
                          </span>
                          {f.required && (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                              Req*
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={Edit2}
                  onClick={() => handleOpenEditModal(tmpl)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  onClick={() => handleDeleteTemplate(tmpl)}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create / Edit Template Modal with Dynamic Field Builder */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create Dynamic Event Template'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Template Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Technical Hackathon"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Event Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Description & Purpose *
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Preset schema for campus coding competitions with GitHub URL and team name."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>

          {/* Dynamic Fields Section */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>Custom Fields Builder ({formData.customFields.length})</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Add custom questions for organizers when creating the event or attendees when registering.
                </p>
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={handleAddField}
              >
                Add Field
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {formData.customFields.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-slate-400">
                  No custom fields defined yet. Click "Add Field" above.
                </div>
              ) : (
                formData.customFields.map((field, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Field #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove Field"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Field Label *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. GitHub Repository URL"
                          value={field.label}
                          onChange={(e) => handleFieldChange(idx, 'label', e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Input Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => handleFieldChange(idx, 'type', e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          {FIELD_TYPES.map((ft) => (
                            <option key={ft.value} value={ft.value}>
                              {ft.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Form Target (Where to show)
                        </label>
                        <select
                          value={field.target}
                          onChange={(e) => handleFieldChange(idx, 'target', e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        >
                          <option value="registration">Attendee Registration Checkout</option>
                          <option value="event">Organizer Event Setup Form</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Placeholder Text
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. https://github.com/..."
                          value={field.placeholder || ''}
                          onChange={(e) => handleFieldChange(idx, 'placeholder', e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Options input for select / radio */}
                    {(field.type === 'select' || field.type === 'radio') && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          Choices / Options (comma separated) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. S, M, L, XL, XXL"
                          value={Array.isArray(field.options) ? field.options.join(', ') : ''}
                          onChange={(e) =>
                            handleFieldChange(
                              idx,
                              'options',
                              e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                            )
                          }
                          className="w-full text-xs p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`req_${idx}`}
                        checked={Boolean(field.required)}
                        onChange={(e) => handleFieldChange(idx, 'required', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={`req_${idx}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Mark field as Mandatory (Required)
                      </label>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSaving}
              icon={CheckCircle2}
            >
              {editingTemplate ? 'Save Template Changes' : 'Create Template'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EventTemplatesPage;
