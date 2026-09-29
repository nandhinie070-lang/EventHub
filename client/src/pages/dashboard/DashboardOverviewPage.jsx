import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  Ticket,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  FileCheck,
  Building2,
  QrCode
} from 'lucide-react';
import Badge from '../../components/common/Badge';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/common/Card';
import Button from '../../components/common/Button';

const DashboardOverviewPage = () => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return null;

  // Role-specific metrics config
  const getMetrics = (role) => {
    switch (role) {
      case 'student':
        return [
          { label: 'Registered Events', value: '3', icon: Ticket, change: '+1 this week', color: 'indigo' },
          { label: 'Upcoming Today', value: '1', icon: Clock, change: 'Next at 2:00 PM', color: 'purple' },
          { label: 'E-Certificates', value: '2', icon: Award, change: 'All verified', color: 'emerald' },
          { label: 'Attendance Rate', value: '100%', icon: CheckCircle2, change: 'Top quartile', color: 'blue' }
        ];

      case 'organizer':
        return [
          { label: 'My Managed Events', value: '4', icon: Calendar, change: '2 live right now', color: 'indigo' },
          { label: 'Total Registrations', value: '312', icon: Users, change: '+45 since yesterday', color: 'purple' },
          { label: 'Pending Approvals', value: '1', icon: Clock, change: 'Awaiting HOD review', color: 'amber' },
          { label: 'Checked In', value: '184', icon: QrCode, change: 'Via live scanner', color: 'emerald' }
        ];

      case 'hod':
        return [
          { label: 'Department Events', value: '8', icon: Building2, change: user.department || 'CSE', color: 'indigo' },
          { label: 'Pending Approvals', value: '2', icon: Clock, change: 'Needs your sign-off', color: 'amber' },
          { label: 'Dept Participation', value: '88%', icon: TrendingUp, change: '+12% vs last sem', color: 'emerald' },
          { label: 'Sanctioned Budgets', value: '$3,800', icon: FileCheck, change: 'Within quota', color: 'blue' }
        ];

      case 'principal':
        return [
          { label: 'Campus-wide Events', value: '24', icon: Building2, change: 'This academic year', color: 'indigo' },
          { label: 'Pending Sanctions', value: '3', icon: ShieldCheck, change: 'Action required', color: 'rose' },
          { label: 'Active Participants', value: '1,420', icon: Users, change: 'Across 9 departments', color: 'purple' },
          { label: 'Inter-College Fests', value: '5', icon: Award, change: 'Apex Institute', color: 'emerald' }
        ];

      case 'admin':
        return [
          { label: 'Total Users', value: '412', icon: Users, change: 'Internal & External', color: 'indigo' },
          { label: 'Active Events', value: '18', icon: Calendar, change: 'Campus ecosystem', color: 'purple' },
          { label: 'System Health', value: '99.9%', icon: ShieldCheck, change: 'All APIs normal', color: 'emerald' },
          { label: 'Pending Verifications', value: '0', icon: CheckCircle2, change: 'Queues clear', color: 'blue' }
        ];

      default:
        return [];
    }
  };

  const metrics = getMetrics(user.role);

  // Sample upcoming campus events
  const sampleEvents = [
    {
      id: 'evt-1',
      title: 'Apex HackFest 2026: 24-Hour AI Challenge',
      department: 'Computer Science & Engineering',
      date: 'Oct 15, 2026',
      time: '09:00 AM',
      venue: 'Main Auditorium & CS Labs',
      type: 'Technical',
      status: 'Approved'
    },
    {
      id: 'evt-2',
      title: 'National Robotics & Embedded IoT Expo',
      department: 'Electronics & Communication',
      date: 'Oct 22, 2026',
      time: '10:30 AM',
      venue: 'Innovation Center',
      type: 'Workshop',
      status: 'Approved'
    },
    {
      id: 'evt-3',
      title: 'Inter-College Cultural Symphony: Tarang',
      department: 'Student Affairs',
      date: 'Nov 05, 2026',
      time: '05:00 PM',
      venue: 'Open Air Amphitheatre',
      type: 'Cultural',
      status: 'In Review'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl gradient-brand p-6 sm:p-8 text-white shadow-soft-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-bold bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                {user.userType === 'internal' ? 'College Portal' : 'Guest Portal'}
              </span>
              <span className="text-xs text-indigo-100 font-medium">
                {user.collegeName || 'Apex Institute of Technology'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {user.name}!
            </h1>
            <p className="text-xs sm:text-sm text-indigo-100 mt-1 max-w-xl">
              {user.role === 'student' &&
                'Track your upcoming events, live passes, and verifiable completion certificates.'}
              {user.role === 'organizer' &&
                'Manage your events, oversee registrations, and scan attendee QR codes in real-time.'}
              {user.role === 'hod' &&
                'Review and authorize departmental event proposals, student rosters, and budget allocations.'}
              {user.role === 'principal' &&
                'Sanction campus-wide initiatives, monitor inter-college events, and inspect institutional reports.'}
              {user.role === 'admin' &&
                'Configure college domains, manage user permissions, and ensure uninterrupted operations.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={user.role} size="lg" className="bg-white/90 text-indigo-900 border-none shadow-sm capitalize">
              Role: {user.role}
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.3 }}
            >
              <Card hoverEffect className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {metric.label}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {metric.value}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">●</span> {metric.change}
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Role Action Quick Bar */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          {user.role === 'student' && (
            <>
              <Link to="/events">
                <Button size="sm" icon={Calendar}>Browse Campus Events</Button>
              </Link>
              <Link to="/my-tickets">
                <Button variant="secondary" size="sm" icon={Ticket}>My Registered Passes</Button>
              </Link>
              <Link to="/certificates">
                <Button variant="outline" size="sm" icon={Award}>Download Certificates</Button>
              </Link>
            </>
          )}

          {user.role === 'organizer' && (
            <>
              <Link to="/events/create">
                <Button size="sm" icon={Calendar}>Create New Event</Button>
              </Link>
              <Link to="/scanner">
                <Button variant="secondary" size="sm" icon={QrCode}>Launch Check-in Scanner</Button>
              </Link>
              <Link to="/attendees">
                <Button variant="outline" size="sm" icon={Users}>Export Attendee Roster</Button>
              </Link>
            </>
          )}

          {user.role === 'hod' && (
            <>
              <Link to="/approvals">
                <Button size="sm" icon={ShieldCheck}>Review Pending Proposals</Button>
              </Link>
              <Link to="/reports">
                <Button variant="secondary" size="sm" icon={FileCheck}>Department Event Report</Button>
              </Link>
              <Link to="/events">
                <Button variant="outline" size="sm" icon={Building2}>Department Events</Button>
              </Link>
            </>
          )}

          {user.role === 'principal' && (
            <>
              <Link to="/approvals">
                <Button size="sm" icon={ShieldCheck}>Authorize Campus Events</Button>
              </Link>
              <Link to="/reports">
                <Button variant="secondary" size="sm" icon={TrendingUp}>Annual Participation Analytics</Button>
              </Link>
              <Link to="/events">
                <Button variant="outline" size="sm" icon={Award}>Campus Events Catalog</Button>
              </Link>
            </>
          )}

          {user.role === 'admin' && (
            <>
              <Link to="/users">
                <Button size="sm" icon={Users}>Manage Users & Roles</Button>
              </Link>
              <Link to="/settings">
                <Button variant="secondary" size="sm" icon={Building2}>College Domain Settings</Button>
              </Link>
              <Link to="/logs">
                <Button variant="outline" size="sm" icon={ShieldCheck}>Audit System Logs</Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Upcoming Campus Events Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Upcoming College Events
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live events scheduled across academic departments
            </p>
          </div>
          <Link to="/events" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
            View All Events &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Event Name</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Schedule</th>
                <th className="py-3.5 px-4">Venue</th>
                <th className="py-3.5 px-6 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sampleEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                    {evt.title}
                  </td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                    {evt.department}
                  </td>
                  <td className="py-4 px-4 text-slate-500 dark:text-slate-400">
                    <span className="block font-medium text-slate-700 dark:text-slate-200">{evt.date}</span>
                    <span className="text-xs">{evt.time}</span>
                  </td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                    {evt.venue}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Badge
                      variant={evt.status === 'Approved' ? 'success' : 'warning'}
                      dot
                      size="sm"
                    >
                      {evt.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverviewPage;
