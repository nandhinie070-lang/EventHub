import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import api from '../../services/api';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import { useToast } from '../../components/common/Toast';

const SystemLogsPage = () => {
  const { addToast } = useToast();

  const [telemetry, setTelemetry] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/logs');
      setTelemetry(res.data.systemHealth);
      setLogs(res.data.auditLogs);
    } catch (err) {
      addToast('Failed to load system logs.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatUptime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}h ${mins}m ${secs}s`;
  };

  if (isLoading || !telemetry) {
    return (
      <div className="space-y-6 p-4">
        <Skeleton className="w-1/3 h-8" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider">
              Telemetry & Operations
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Activity className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <span>System Telemetry & Audit Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time process status, background worker logs, and server performance metrics.
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchLogs}>
          Refresh Telemetry
        </Button>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Server & Node */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Process</span>
            <Server className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatUptime(telemetry.uptimeSeconds)}
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>Node: <strong className="text-slate-700 dark:text-slate-300">{telemetry.nodeVersion}</strong></p>
            <p className="truncate">OS: {telemetry.platform}</p>
          </div>
        </div>

        {/* Database */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Database</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 capitalize">
            {telemetry.database.state}
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>Engine: <strong>MongoDB Atlas / Local</strong></p>
            <p>Database: <strong>{telemetry.database.name}</strong></p>
          </div>
        </div>

        {/* Memory */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Memory Allocation</span>
            <Cpu className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">
            {telemetry.memory.heapUsedMB} MB
          </p>
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>Heap Total: {telemetry.memory.heapTotalMB} MB</p>
            <p>RSS Allocation: {telemetry.memory.rssMB} MB</p>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Operational Audit Trail
          </h3>
          <span className="text-xs text-slate-400">Showing recent 30 entries</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Timestamp</th>
                <th className="py-3.5 px-4">Event Type</th>
                <th className="py-3.5 px-6">Details</th>
                <th className="py-3.5 px-6 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3.5 px-6 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300 font-sans">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <Badge
                      variant={
                        log.severity === 'warning'
                          ? 'warning'
                          : log.severity === 'error'
                          ? 'danger'
                          : 'default'
                      }
                      size="sm"
                    >
                      {log.severity}
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

export default SystemLogsPage;
