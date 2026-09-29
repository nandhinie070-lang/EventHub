import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Search,
  Filter,
  MapPin,
  Users,
  Tag,
  ArrowRight,
  PlusCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { fetchEvents } from '../../features/events/eventSlice';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

const EventsExplorePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { events, isLoading, total } = useSelector((state) => state.events);
  const { user } = useSelector((state) => state.auth);
  const collegeConfig = useSelector((state) => state.auth.collegeConfig);

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    'All',
    'Technical',
    'Workshop',
    'Cultural',
    'Hackathon',
    'Sports',
    'Seminar'
  ];

  useEffect(() => {
    dispatch(
      fetchEvents({
        category: selectedCategory,
        department: selectedDepartment,
        search: searchTerm
      })
    );
  }, [dispatch, selectedCategory, selectedDepartment, searchTerm]);

  const canCreate = user && ['organizer', 'admin'].includes(user.role);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              {collegeConfig?.name || 'Campus Events'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Explore Campus Events
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Discover workshops, hackathons, and cultural festivals happening across the college.
          </p>
        </div>

        {canCreate && (
          <Link to="/events/create">
            <Button icon={PlusCircle} size="md" className="shadow-glow">
              Propose New Event
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, topic, or keyword (e.g., AI, Robotics, Hackathon)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="All">All Departments</option>
              {collegeConfig?.departments?.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200
                ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-soft font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 space-y-4"
            >
              <Skeleton variant="card" className="h-44" />
              <Skeleton className="w-1/3 h-5" />
              <Skeleton className="w-full h-6" />
              <Skeleton className="w-2/3 h-4" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Events Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, category pill, or department filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-5"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedDepartment('All');
              setSearchTerm('');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {events.map((evt, idx) => {
              const startDate = new Date(evt.startDate);
              const formattedDate = startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
              const formattedTime = startDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              });

              const capacityPercentage = Math.min(
                Math.round(((evt.registeredCount || 0) / (evt.capacity || 100)) * 100),
                100
              );

              return (
                <motion.div
                  key={evt._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft hover:shadow-soft-lg transition-all overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Event Banner */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={evt.bannerUrl}
                        alt={evt.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.target.src =
                            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Top Floating Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge variant="primary" size="sm">
                          {evt.category}
                        </Badge>
                        <Badge
                          variant={evt.venueMode === 'online' ? 'accent' : 'default'}
                          size="sm"
                          className="capitalize"
                        >
                          {evt.venueMode}
                        </Badge>
                      </div>

                      {/* Status indicator if viewing as staff */}
                      {user && ['organizer', 'hod', 'principal', 'admin'].includes(user.role) && (
                        <div className="absolute top-3 right-3">
                          <Badge
                            variant={
                              evt.status === 'approved'
                                ? 'success'
                                : evt.status === 'rejected'
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                            dot
                          >
                            {evt.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      )}

                      {/* Date Badge over banner */}
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                        <span>{formattedDate} • {formattedTime}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1 truncate">
                        {evt.department}
                      </p>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {evt.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                        {evt.description}
                      </p>

                      <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{evt.venueLocation}</span>
                      </div>

                      {/* Capacity Bar */}
                      <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Registrations</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            {evt.registeredCount || 0} / {evt.capacity}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
                            style={{ width: `${capacityPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-5 pt-0 mt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {evt.isPaid ? `$${evt.fee}` : 'Free Entry'}
                    </span>

                    <Link to={`/events/${evt._id}`}>
                      <Button size="sm" variant="outline" icon={ArrowRight} iconPosition="right">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default EventsExplorePage;
