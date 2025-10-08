'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface Payment {
  _id: string;
  userId: string;
  planId: string;
  amount: number;
  phoneNumber: string;
  merchantRequestId: string;
  checkoutRequestId: string;
  status: 'pending' | 'completed' | 'failed';
  resultCode?: number;
  resultDesc?: string;
  mpesaReceiptNumber?: string;
  createdAt: string;
  updatedAt: string;
}

interface Session {
  _id: string;
  userId: string;
  paymentId?: string;
  lastActive: string;
  connectionHistory: Array<{
    connectedAt: string;
    disconnectedAt?: string;
    ipAddress: string;
    deviceInfo: string;
    dataUsed: number;
  }>;
  notifications: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
}

interface WebSocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  recentPayments: Payment[];
  activeSessions: Session[];
  error: string | null;
}

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  isConnected: false,
  recentPayments: [],
  activeSessions: [],
  error: null,
});

export const useWebSocket = () => useContext(WebSocketContext);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setError(null);
      
      // Join admin-specific rooms
      newSocket.emit('join', 'transactions');
      newSocket.emit('join', 'sessions');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    newSocket.on('payment:update', (payment: Payment) => {
      console.log('Payment update received:', payment);
      setRecentPayments(prev => {
        const filtered = prev.filter(p => p._id !== payment._id);
        return [payment, ...filtered].slice(0, 10); // Keep last 10 payments
      });
    });

    newSocket.on('session:update', (session: Session) => {
      console.log('Session update received:', session);
      setActiveSessions(prev => {
        const filtered = prev.filter(s => s._id !== session._id);
        return [session, ...filtered];
      });
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setError(`Connection error: ${error.message}`);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, recentPayments, activeSessions, error }}>
      {children}
    </WebSocketContext.Provider>
  );
}