import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart2,
  TrendingUp,
  Users,
  Calendar,
  CheckCircle2,
  Award,
  Building,
  Sparkles,
  PieChart as PieIcon
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import api from '../../services/api';
import Card, { CardTitle, CardContent } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import { Download, FileText } from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const AnalyticsReportsPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventsList, setEventsList] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [resAnalytics, resEvents] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/events?limit=50')
        ]);
        setData(resAnalytics.data);
        const evts = resEvents.data?.events || [];
        setEventsList(evts);
        if (evts.length > 0) {
          setSelectedEventId(evts[0]._id);
        }
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const handleExportReport = async () => {
    if (!selectedEventId) return;
    try {
      setIsDownloadingReport(true);
      const chosenEvent = eventsList.find((e) => e._id === selectedEventId);
      const res = await api.get(`/events/${selectedEventId}/report-pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `Event_Report_${(chosenEvent?.title || 'Report').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report download error:', err);
      alert(
        err.response?.data?.message ||
          'Failed to download event report PDF. Authorized event organizers and administrators only.'
      );
    } finally {
      setIsDownloadingReport(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="w-1/3 h-8" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-3xl" />
      </div>
    );
  }

  const { kpis, departmentStats, categoryStats, monthlyTrends } = data;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
            Institutional Intelligence
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <BarChart2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <span>College Event Analytics & Reports</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Real-time metrics, participation trends, and departmental performance across the campus ecosystem.
        </p>
      </div>

      {/* Feature 3: Executive Post-Event PDF Report Exporter */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-soft-xl border border-indigo-900/60 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-4 h-4 text-indigo-400" />
            <span>Official Institutional Audit</span>
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Download Event Closure & Analytics Report (PDF)
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Generate and export the verifiable post-event report including turnout, gate attendance %, food coupon redemption, attendee star feedback, and ground issue SLA audit.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="text-xs font-semibold px-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full sm:w-64"
          >
            <option value="" className="text-slate-900">
              -- Select Event to Export --
            </option>
            {eventsList.map((evt) => (
              <option key={evt._id} value={evt._id} className="text-slate-900">
                {evt.title} ({evt.department || 'Campus'})
              </option>
            ))}
          </select>

          <Button
            variant="primary"
            size="md"
            icon={Download}
            isLoading={isDownloadingReport}
            disabled={!selectedEventId}
            onClick={handleExportReport}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white shadow-glow"
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Events</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {kpis.totalEvents}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
            {kpis.approvedEvents} live approved
          </p>
        </Card>

        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registrations</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {kpis.totalRegistrations}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Across all categories
          </p>
        </Card>

        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Attendance Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {kpis.attendanceRate}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {kpis.totalCheckedIn} confirmed check-ins
          </p>
        </Card>

        <Card className="p-5" hoverEffect>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Certificates Awarded</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
            {kpis.totalCertificates}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Tamper-proof verifiable
          </p>
        </Card>
      </div>

      {/* Chart 1: Monthly Participation Trends */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Campus Participation Trends
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Registrations vs. Verified Gate Admissions over time
            </p>
          </div>
          <Badge variant="primary" size="sm">
            Monthly Curve
          </Badge>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="regGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="attGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e1b4b',
                  borderRadius: '12px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Area
                type="monotone"
                dataKey="registrations"
                name="Registrations"
                stroke="#6366f1"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#regGradient)"
              />
              <Area
                type="monotone"
                dataKey="attendance"
                name="Checked In Attendees"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#attGradient)"
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid: BarChart & PieChart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Department Activity Bar Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Department Engagement
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Total event capacity and attendee registrations by academic branch
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey="department"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => val.split(' ')[0]}
                />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="registrations" name="Registrations" fill="#6366f1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="capacity" name="Capacity" fill="#c7d2fe" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            Event Domain Mix
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Proportion of events by category (Technical, Cultural, Workshops...)
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryStats}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e1b4b',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportsPage;
