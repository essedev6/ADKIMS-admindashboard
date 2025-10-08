'use client';

import { useState, useEffect } from 'react';
import { ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import io from 'socket.io-client';
import LogExport from './LogExport';

interface SessionLog {
  id: number;
  user_id: number;
  user_name: string;
  device_mac: string;
  device_ip: string;
  plan_name: string;
  start_time: string;
  end_time: string | null;
  data_used: number;
  duration: number;
}

interface SessionFilter {
  search: string;
  dateRange: {
    start: string;
    end: string;
  };
  status: 'all' | 'active' | 'completed';
}

export default function SessionLogs() {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [filter, setFilter] = useState<SessionFilter>({
    search: '',
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
    status: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001');

    socket.on('session-logs', (data: { logs: SessionLog[]; totalPages: number }) => {
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    });

    socket.emit('get-session-logs', {
      filter,
      page: currentPage,
      limit: 10,
    });

    return () => {
      socket.disconnect();
    };
  }, [filter, currentPage]);

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="backdrop-blur-card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by user, MAC address, or IP..."
              value={filter.search}
              onChange={(e) => setFilter({ ...filter, search: e.target.value })}
              className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg pl-10 pr-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500/50"
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <input
                type="date"
                value={filter.dateRange.start}
                onChange={(e) => setFilter({
                  ...filter,
                  dateRange: { ...filter.dateRange, start: e.target.value },
                })}
                className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <input
                type="date"
                value={filter.dateRange.end}
                onChange={(e) => setFilter({
                  ...filter,
                  dateRange: { ...filter.dateRange, end: e.target.value },
                })}
                className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value as 'all' | 'active' | 'completed' })}
              className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500/50"
            >
              <option value="all">All Sessions</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>
        </div>

        {/* Session Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-blue-500/10">
                <th className="pb-3 font-medium text-gray-400">User</th>
                <th className="pb-3 font-medium text-gray-400">Device</th>
                <th className="pb-3 font-medium text-gray-400">Plan</th>
                <th className="pb-3 font-medium text-gray-400">Start Time</th>
                <th className="pb-3 font-medium text-gray-400">Duration</th>
                <th className="pb-3 font-medium text-gray-400">Data Used</th>
                <th className="pb-3 font-medium text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-blue-500/10 last:border-0">
                  <td className="py-4">{log.user_name}</td>
                  <td className="py-4">
                    <div>
                      <p className="text-gray-300">{log.device_mac}</p>
                      <p className="text-gray-400 text-xs">{log.device_ip}</p>
                    </div>
                  </td>
                  <td className="py-4">{log.plan_name}</td>
                  <td className="py-4">{new Date(log.start_time).toLocaleString()}</td>
                  <td className="py-4">{formatDuration(log.duration)}</td>
                  <td className="py-4">{formatBytes(log.data_used)}</td>
                  <td className="py-4">
                    <span
                      className={`status-badge ${log.end_time ? 'status-badge-inactive' : 'status-badge-active'}`}
                    >
                      {log.end_time ? 'Completed' : 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-400">
            Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, logs.length)} of {logs.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Export Component */}
      <LogExport
        type="session"
        onExportStart={() => setIsExporting(true)}
        onExportComplete={() => setIsExporting(false)}
      />
    </div>
  );
}