import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  Mail,
  Cloud,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

const CollegeSettingsPage = () => {
  const { addToast } = useToast();

  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newDepartment, setNewDepartment] = useState('');

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/settings');
      setSettings(res.data.settings);
    } catch (err) {
      addToast('Failed to load college settings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    if (settings.departments.includes(newDepartment.trim())) {
      addToast('Department already exists.', 'error');
      return;
    }
    setSettings({
      ...settings,
      departments: [...settings.departments, newDepartment.trim()]
    });
    setNewDepartment('');
  };

  const handleRemoveDepartment = (deptToRemove) => {
    setSettings({
      ...settings,
      departments: settings.departments.filter((d) => d !== deptToRemove)
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/admin/settings', settings);
      addToast(res.data.message || 'Settings saved successfully!', 'success');
    } catch (err) {
      addToast('Failed to update settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="w-1/3 h-8" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
            Institutional Configuration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Building2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <span>College Profile & Domain Settings</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure official institutional metadata, academic departments, and registration domain rules.
        </p>
      </div>

      {/* Integration Status Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Database</span>
            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Connected (MongoDB)
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Email Gateway</span>
            <p className="text-xs font-bold text-indigo-600">
              {settings.smtpConfigured ? 'Active (SMTP)' : 'Console OTP Fallback'}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
            <Cloud className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Cloud Storage</span>
            <p className="text-xs font-bold text-purple-600">
              {settings.cloudinaryConfigured ? 'Cloudinary Connected' : 'CDN Enabled'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Institution Profile
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="College Name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              required
            />
            <Input
              label="Short Code / Acronym"
              value={settings.shortName}
              onChange={(e) => setSettings({ ...settings, shortName: e.target.value })}
              required
            />
          </div>

          <Input
            label="Official Student & Faculty Email Domain"
            value={settings.domain}
            onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
            helperText="Internal members must have emails ending with this domain (e.g. @apex.edu)"
            required
          />
        </div>

        {/* Academic Departments */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800">
            Academic Departments ({settings.departments.length})
          </h3>

          {/* Add Department Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Biomedical Engineering..."
              value={newDepartment}
              onChange={(e) => setNewDepartment(e.target.value)}
              className="flex-1 py-2 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <Button size="sm" icon={Plus} onClick={handleAddDepartment}>
              Add Branch
            </Button>
          </div>

          {/* Department Chips */}
          <div className="flex flex-wrap gap-2 pt-2">
            {settings.departments.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
              >
                <span>{dept}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDepartment(dept)}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            isLoading={isSaving}
            icon={Save}
            className="shadow-glow"
          >
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CollegeSettingsPage;
