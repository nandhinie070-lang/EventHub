import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Bell,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { logout } from '../../features/auth/authSlice';
import Badge from '../common/Badge';

const Navbar = ({ onToggleSidebar, isSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const [darkMode, setDarkMode] = useState(() => {
    return (
      localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass dark:glass-dark border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center space-x-3">
            {isAuthenticated && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 focus:outline-none"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            )}

            <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center space-x-2.5 group">
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center text-white shadow-soft group-hover:shadow-glow transition-all duration-300">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  EventHub
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400">
                    AIT
                  </span>
                </span>
              </div>
            </Link>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors focus:outline-none"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>

            {isAuthenticated && user ? (
              <div className="relative">
                {/* User avatar menu trigger */}
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {user.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200/80 dark:border-slate-800/80 p-2 z-30 animate-fadeIn">
                      <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {user.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <Badge variant={user.role} size="sm">
                            {user.role}
                          </Badge>
                          <Badge variant="default" size="sm">
                            {user.userType === 'internal' ? 'Internal' : 'External'}
                          </Badge>
                        </div>
                      </div>

                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl"
                        >
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>Dashboard Profile</span>
                        </Link>
                      </div>

                      <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-soft transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
