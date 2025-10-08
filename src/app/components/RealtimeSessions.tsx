'use client';

import { useWebSocket } from '../contexts/WebSocketContext';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(startTime: string) {
  const start = new Date(startTime).getTime();
  const now = new Date().getTime();
  const diff = now - start;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

export default function RealtimeSessions() {
  const { activeSessions, isConnected, error } = useWebSocket();

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Active Sessions</h2>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {activeSessions.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No active sessions</p>
        ) : (
          activeSessions.map((session) => {
            const lastConnection = session.connectionHistory[session.connectionHistory.length - 1];
            return (
              <div
                key={session._id}
                className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">
                      {lastConnection.deviceInfo || 'Unknown Device'}
                    </p>
                    <p className="text-sm text-gray-400">{lastConnection.ipAddress}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 text-xs rounded bg-blue-500/20 text-blue-400">
                      ACTIVE
                    </span>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Duration</p>
                    <p className="text-white">{formatDuration(lastConnection.connectedAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Data Used</p>
                    <p className="text-white">{formatBytes(lastConnection.dataUsed)}</p>
                  </div>
                </div>
                {session.notifications && session.notifications.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-yellow-400">
                      {session.notifications[session.notifications.length - 1].message}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}