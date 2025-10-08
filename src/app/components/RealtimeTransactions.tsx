'use client';

import { useWebSocket } from '../contexts/WebSocketContext';

export default function RealtimeTransactions() {
  const { recentPayments, isConnected, error } = useWebSocket();

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Real-time Transactions</h2>
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
        {recentPayments.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No recent transactions</p>
        ) : (
          recentPayments.map((payment) => (
            <div
              key={payment._id}
              className={`p-4 rounded-lg border ${
                payment.status === 'completed'
                  ? 'bg-green-500/10 border-green-500/20'
                  : payment.status === 'failed'
                  ? 'bg-red-500/10 border-red-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white font-medium">
                    KES {payment.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-400">{payment.phoneNumber}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded ${
                      payment.status === 'completed'
                        ? 'bg-green-500/20 text-green-400'
                        : payment.status === 'failed'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}
                  >
                    {payment.status.toUpperCase()}
                  </span>
                  {payment.mpesaReceiptNumber && (
                    <p className="text-xs text-gray-400 mt-1">
                      Receipt: {payment.mpesaReceiptNumber}
                    </p>
                  )}
                </div>
              </div>
              {payment.resultDesc && payment.status === 'failed' && (
                <p className="text-sm text-red-400 mt-2">{payment.resultDesc}</p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                {new Date(payment.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}