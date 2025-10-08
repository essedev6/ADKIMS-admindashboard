import React, { useState, useEffect } from 'react';

interface ActiveSession {
  userId: string;
  userName: string;
  userEmail: string;
  amountPaid: number;
  planDuration: number; // in milliseconds
  paymentDateTime: string;
  expiryTime: string;
  remainingTime: number; // in milliseconds
}

const ActiveSessionsTable: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const response = await fetch('/api/active-sessions');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ActiveSession[] = await response.json();
        setActiveSessions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveSessions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveSessions, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) return <p className="text-white">Loading active sessions...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="backdrop-blur-card p-6 rounded-2xl border border-blue-500/20">
      <h3 className="text-lg font-semibold mb-4">Active User Sessions</h3>
      {activeSessions.length === 0 ? (
        <p className="text-gray-400">No active sessions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount Paid</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan Duration</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Payment Date & Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expiry Time</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Remaining Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {activeSessions.map((session) => (
                <tr key={session.userId}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{session.userId}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{session.userName}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">KES {session.amountPaid}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{formatDuration(session.planDuration)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{new Date(session.paymentDateTime).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{new Date(session.expiryTime).toLocaleString()}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300">{formatDuration(session.remainingTime)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ActiveSessionsTable;