import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  UserCheck,
  Building,
  Mail,
  QrCode
} from 'lucide-react';
import { fetchEventAttendees, checkInAttendee } from '../../features/tickets/ticketSlice';
import { fetchEvents } from '../../features/events/eventSlice';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

const AttendeesRosterPage = () => {
  const dispatch = useDispatch();
  const { addToast } = useToast();

  const { events } = useSelector((state) => state.events);
  const { attendees, eventInfo, isLoading } = useSelector((state) => state.tickets);
  const { user } = useSelector((state) => state.auth);

  const [selectedEventId, setSelectedEventId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'true' | 'false'

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  // Set default event
  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id);
    }
  }, [events, selectedEventId]);

  useEffect(() => {
    if (selectedEventId) {
      dispatch(
        fetchEventAttendees({
          eventId: selectedEventId,
          search: searchTerm,
          checkedIn: filterStatus === 'all' ? undefined : filterStatus
        })
      );
    }
  }, [dispatch, selectedEventId, searchTerm, filterStatus]);

  const handleManualCheckIn = async (ticketCode) => {
    try {
      await dispatch(
        checkInAttendee({
          ticketCode,
          eventId: selectedEventId
        })
      ).unwrap();
      addToast('Attendee manually checked in!', 'success');
      dispatch(
        fetchEventAttendees({
          eventId: selectedEventId,
          search: searchTerm,
          checkedIn: filterStatus === 'all' ? undefined : filterStatus
        })
      );
    } catch (err) {
      addToast(err?.message || 'Check-in failed', 'error');
    }
  };

  const handleExportCSV = () => {
    if (!attendees || attendees.length === 0) return;

    const headers = ['Name', 'Email', 'RollNo/College', 'Department', 'TicketCode', 'CheckedIn', 'CheckedInAt'];
    const rows = attendees.map((a) => [
      a.user?.name || '',
      a.user?.email || '',
      a.user?.rollNo || a.user?.collegeName || '',
      a.user?.department || '',
      a.ticketCode,
      a.checkedIn ? 'YES' : 'NO',
      a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendees_${selectedEventId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const attendanceRate =
    eventInfo && eventInfo.registeredCount > 0
      ? Math.round(((eventInfo.checkedInCount || 0) / eventInfo.registeredCount) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              Participant Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span>Attendee Roster</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            View verified registrants, track live gate admissions, and export registration manifests.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          icon={Download}
          onClick={handleExportCSV}
          disabled={attendees.length === 0}
        >
          Export CSV Manifest
        </Button>
      </div>

      {/* Event Selector & Event KPIs */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="w-full sm:w-auto flex-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Select Event
            </label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full sm:max-w-md py-2.5 px-3 rounded-xl text-sm font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {events.map((evt) => (
                <option key={evt._id} value={evt._id}>
                  {evt.title} ({evt.department})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Stats Chips */}
        {eventInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Capacity</span>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {eventInfo.capacity}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
              <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400">Registered</span>
              <p className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">
                {eventInfo.registeredCount}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Admitted / Checked In</span>
              <p className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                {eventInfo.checkedInCount || 0}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40">
              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Attendance Rate</span>
              <p className="text-2xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
                {attendanceRate}%
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, roll number, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Registrants
          </button>
          <button
            onClick={() => setFilterStatus('true')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              filterStatus === 'true'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Checked In
          </button>
          <button
            onClick={() => setFilterStatus('false')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
              filterStatus === 'false'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Not Checked In
          </button>
        </div>
      </div>

      {/* Attendee Manifest Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : attendees.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No attendees match the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Attendee</th>
                  <th className="py-3.5 px-4">Affiliation</th>
                  <th className="py-3.5 px-4">Pass Code</th>
                  <th className="py-3.5 px-4">Admission Status</th>
                  <th className="py-3.5 px-6 text-right">Gate Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {attendees.map((att) => (
                  <tr
                    key={att._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {att.user?.name}
                      </p>
                      <p className="text-xs text-slate-400">{att.user?.email}</p>
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      <p className="font-medium">
                        {att.user?.userType === 'internal'
                          ? att.user.rollNo
                          : att.user?.collegeName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {att.user?.department || 'External Guest'}
                      </p>
                    </td>

                    <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {att.ticketCode}
                    </td>

                    <td className="py-4 px-4">
                      {att.checkedIn ? (
                        <div className="space-y-0.5">
                          <Badge variant="success" size="sm" dot>
                            Admitted
                          </Badge>
                          <span className="block text-[10px] text-slate-400">
                            {new Date(att.checkedInAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="default" size="sm">
                          Pending
                        </Badge>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      {!att.checkedIn ? (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={CheckCircle2}
                          onClick={() => handleManualCheckIn(att.ticketCode)}
                        >
                          Admit
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Admitted
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendeesRosterPage;
