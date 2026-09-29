import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Search,
  Shield,
  CheckCircle2,
  XCircle,
  Building,
  GraduationCap,
  Sparkles,
  Lock,
  Unlock
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

const UserDirectoryPage = () => {
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  const roles = ['All', 'student', 'organizer', 'hod', 'principal', 'admin'];

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/users', {
        params: {
          search: searchTerm,
          role: selectedRole === 'All' ? undefined : selectedRole
        }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      addToast('Failed to load user directory.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, searchTerm]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      addToast(`Role updated to ${newRole}`, 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update role.', 'error');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.patch(`/users/${userId}/toggle-status`);
      addToast(res.data.message, 'success');
      fetchUsers();
    } catch (err) {
      addToast('Status toggle failed.', 'error');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
            System Administration
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          <span>User Directory & Permissions</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage campus user accounts, grant operational privileges, and audit role access.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRole(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap ${
                selectedRole === r
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="w-full h-12" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
            No users found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">User Profile</th>
                  <th className="py-3.5 px-4">Affiliation</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-6 text-right">Account Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {u.name}
                        {!u.isActive && (
                          <span className="text-[10px] text-rose-500 font-bold">(Deactivated)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>

                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                      <p className="font-medium">
                        {u.userType === 'internal' ? u.rollNo : u.collegeName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {u.department || 'External Affiliate'}
                      </p>
                    </td>

                    <td className="py-4 px-4">
                      <Badge variant="default" size="sm">
                        {u.userType === 'internal' ? 'College Member' : 'Guest'}
                      </Badge>
                    </td>

                    {/* Role Dropdown */}
                    <td className="py-4 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        className="py-1 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 capitalize focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="student">Student</option>
                        <option value="organizer">Organizer</option>
                        <option value="hod">HOD</option>
                        <option value="principal">Principal</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    {/* Status Toggle Action */}
                    <td className="py-4 px-6 text-right">
                      <Button
                        size="sm"
                        variant={u.isActive ? 'ghost' : 'outline'}
                        icon={u.isActive ? Lock : Unlock}
                        onClick={() => handleToggleStatus(u._id)}
                      >
                        {u.isActive ? 'Deactivate' : 'Reactivate'}
                      </Button>
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

export default UserDirectoryPage;
