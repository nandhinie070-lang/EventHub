import React from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Award,
  PlusCircle,
  Users,
  CheckSquare,
  FileBarChart2,
  Settings,
  ShieldCheck,
  Building2,
  QrCode,
  AlertTriangle,
  Layers
} from 'lucide-react';
import Badge from '../common/Badge';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) return null;

  // Role-specific navigation items
  const getNavItems = (role) => {
    switch (role) {
      case 'student':
        return [
          { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
          { label: 'Explore Events', to: '/events', icon: Calendar },
          { label: 'My Registrations', to: '/my-tickets', icon: Ticket },
          { label: 'Certificates', to: '/certificates', icon: Award },
          { label: 'Issue Tracker', to: '/issues/my', icon: AlertTriangle }
        ];

      case 'organizer':
        return [
          { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
          { label: 'My Events', to: '/events', icon: Calendar },
          { label: 'Create Event', to: '/events/create', icon: PlusCircle },
          { label: 'Registrations', to: '/attendees', icon: Users },
          { label: 'QR Check-in', to: '/scanner', icon: QrCode },
          { label: 'Issue & SLA Board', to: '/issues/board', icon: AlertTriangle }
        ];

      case 'hod':
        return [
          { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
          { label: 'Department Events', to: '/events', icon: Calendar },
          { label: 'HOD Approvals', to: '/approvals', icon: CheckSquare },
          { label: 'Dept Reports', to: '/reports', icon: FileBarChart2 },
          { label: 'Issue & SLA Board', to: '/issues/board', icon: AlertTriangle }
        ];

      case 'principal':
        return [
          { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
          { label: 'Campus Events', to: '/events', icon: Calendar },
          { label: 'Final Approvals', to: '/approvals', icon: ShieldCheck },
          { label: 'College Analytics', to: '/reports', icon: FileBarChart2 },
          { label: 'Issue & SLA Board', to: '/issues/board', icon: AlertTriangle }
        ];

      case 'admin':
        return [
          { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
          { label: 'User Directory', to: '/users', icon: Users },
          { label: 'All Events', to: '/events', icon: Calendar },
          { label: 'Event Templates', to: '/admin/templates', icon: Layers },
          { label: 'Issue & SLA Board', to: '/issues/board', icon: AlertTriangle },
          { label: 'College Settings', to: '/settings', icon: Building2 },
          { label: 'System Logs', to: '/logs', icon: Settings }
        ];

      default:
        return [
          { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
          { label: 'Events', to: '/events', icon: Calendar }
        ];
    }
  };

  const navItems = getNavItems(user.role);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`
          fixed md:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64
          bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl
          border-r border-slate-200/80 dark:border-slate-800/80
          flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex flex-col space-y-6">
          {/* User mini summary badge */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100/80 dark:border-indigo-900/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                Active Portal
              </span>
              <Badge variant={user.role} size="sm">
                {user.role}
              </Badge>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {user.userType === 'internal'
                ? `${user.department || 'AIT'} • ${user.year || 'Student'}`
                : user.collegeName || 'External Guest'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Menu
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  onClick={onClose}
                  end={item.to === '/dashboard'}
                  className={({ isActive }) => `
                    flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-soft font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between px-2">
          <span>Apex Institute</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Online" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
