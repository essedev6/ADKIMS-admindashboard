'use client';

import { useState } from 'react';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import io from 'socket.io-client';

interface LogExportProps {
  type: 'user' | 'session';
  onExportStart: () => void;
  onExportComplete: () => void;
}

interface ExportOptions {
  format: 'csv' | 'pdf';
  dateRange: {
    start: string;
    end: string;
  };
  includeFields: string[];
}

export default function LogExport({ type, onExportStart, onExportComplete }: LogExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
      end: new Date().toISOString().split('T')[0],
    },
    includeFields: type === 'user' 
      ? ['id', 'name', 'email', 'status', 'plan_id', 'created_at']
      : ['id', 'user_id', 'device_mac', 'device_ip', 'start_time', 'end_time', 'data_used'],
  });

  const handleExport = async () => {
    setIsExporting(true);
    onExportStart();

    const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001');

    socket.emit('export-logs', {
      type,
      options: exportOptions,
    });

    socket.on('export-complete', (data: { url: string }) => {
      const link = document.createElement('a');
      link.href = data.url;
      link.download = `${type}-logs-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      onExportComplete();
      socket.disconnect();
    });

    socket.on('export-error', (error: string) => {
      console.error('Export failed:', error);
      setIsExporting(false);
      onExportComplete();
      socket.disconnect();
    });
  };

  return (
    <div className="backdrop-blur-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <DocumentArrowDownIcon className="w-6 h-6 text-blue-400" />
        <h3 className="text-xl font-semibold">Export {type === 'user' ? 'User' : 'Session'} Logs</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Export Format
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value="csv"
                checked={exportOptions.format === 'csv'}
                onChange={(e) => setExportOptions({ ...exportOptions, format: 'csv' })}
                className="text-blue-500 focus:ring-blue-500 h-4 w-4"
              />
              <span>CSV</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={exportOptions.format === 'pdf'}
                onChange={(e) => setExportOptions({ ...exportOptions, format: 'pdf' })}
                className="text-blue-500 focus:ring-blue-500 h-4 w-4"
              />
              <span>PDF</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={exportOptions.dateRange.start}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                dateRange: { ...exportOptions.dateRange, start: e.target.value },
              })}
              className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={exportOptions.dateRange.end}
              onChange={(e) => setExportOptions({
                ...exportOptions,
                dateRange: { ...exportOptions.dateRange, end: e.target.value },
              })}
              className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-gray-300 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Include Fields
          </label>
          <div className="grid grid-cols-2 gap-2">
            {exportOptions.includeFields.map((field) => (
              <label key={field} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={exportOptions.includeFields.includes(field)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setExportOptions({
                        ...exportOptions,
                        includeFields: [...exportOptions.includeFields, field],
                      });
                    } else {
                      setExportOptions({
                        ...exportOptions,
                        includeFields: exportOptions.includeFields.filter((f) => f !== field),
                      });
                    }
                  }}
                  className="text-blue-500 focus:ring-blue-500 h-4 w-4"
                />
                <span className="capitalize">{field.replace(/_/g, ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleExport}
            disabled={isExporting || exportOptions.includeFields.length === 0}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isExporting ? 'bg-blue-500/20 text-blue-400 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
          >
            <DocumentArrowDownIcon className="w-5 h-5" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}