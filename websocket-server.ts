import { Server } from 'socket.io';
import { createServer } from 'http';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  plan_id: number;
}

interface Device {
  mac_address: string;
  ip_address: string;
  status: 'active' | 'blacklisted';
  last_seen: string;
}

interface Session {
  id: number;
  user_id: number;
  device_mac: string;
  device_ip: string;
  start_time: string;
  end_time: string | null;
  plan_id: number;
  data_used: number;
  time_remaining: number;
}

interface Payment {
  id: number;
  name: string;
  amount: number;
  timestamp: string;
}

interface DashboardData {
  totalPayments: number;
  activeUsers: number;
  recentPayments: Payment[];
  earningsData: Array<{
    name: string;
    earnings: number;
  }>;
  activeSessions: Session[];
  deviceStats: {
    total: number;
    blacklisted: number;
    active: number;
  };
  bandwidthUsage: Array<{
    hour: number;
    usage: number;
  }>;
}

async function fetchDashboardData(): Promise<DashboardData> {
  const client = await pool.connect();
  try {
    // Fetch total payments
    const totalPaymentsResult = await client.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments'
    );
    const totalPayments = parseFloat(totalPaymentsResult.rows[0].total);

    // Fetch active users count
    const activeUsersResult = await client.query(
      "SELECT COUNT(*) as count FROM users WHERE status = 'active'"
    );
    const activeUsers = parseInt(activeUsersResult.rows[0].count);

    // Fetch recent payments
    const recentPaymentsResult = await client.query<Payment>(
      'SELECT id, name, amount, timestamp FROM payments ORDER BY timestamp DESC LIMIT 5'
    );
    const recentPayments = recentPaymentsResult.rows;

    // Fetch earnings data
    const earningsDataResult = await client.query(
      `SELECT 
        to_char(date_trunc('month', timestamp), 'Mon') as name,
        COALESCE(SUM(amount), 0) as earnings
      FROM payments
      GROUP BY date_trunc('month', timestamp)
      ORDER BY date_trunc('month', timestamp)
      LIMIT 8`
    );
    const earningsData = earningsDataResult.rows;

    // Fetch active sessions
    const activeSessionsResult = await client.query<Session>(
      `SELECT 
        s.id, s.user_id, s.device_mac, s.device_ip, s.start_time, 
        s.end_time, s.plan_id, s.data_used, s.time_remaining
      FROM sessions s
      WHERE s.end_time IS NULL
      ORDER BY s.start_time DESC`
    );
    const activeSessions = activeSessionsResult.rows;

    // Fetch device statistics
    const deviceStatsResult = await client.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'blacklisted' THEN 1 END) as blacklisted,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active
      FROM devices`
    );
    const deviceStats = deviceStatsResult.rows[0];

    // Fetch hourly bandwidth usage
    const bandwidthUsageResult = await client.query(
      `SELECT 
        EXTRACT(HOUR FROM timestamp) as hour,
        SUM(data_used) as usage
      FROM session_logs
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY EXTRACT(HOUR FROM timestamp)
      ORDER BY hour`
    );
    const bandwidthUsage = bandwidthUsageResult.rows;

    return {
      totalPayments,
      activeUsers,
      recentPayments,
      earningsData,
      activeSessions,
      deviceStats,
      bandwidthUsage
    };
  } finally {
    client.release();
  }
}

// Listen for database changes
pool.connect((err, client) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }

  // Listen for various database changes
  client.query('LISTEN dashboard_changes');
  client.query('LISTEN session_changes');
  client.query('LISTEN device_changes');

  client.on('notification', async (msg) => {
    const data = await fetchDashboardData();
    io.emit('dashboard-update', data);

    // Handle specific notifications
    if (msg.channel === 'session_changes') {
      const payload = JSON.parse(msg.payload || '{}');
      io.emit('session-update', payload);
    } else if (msg.channel === 'device_changes') {
      const payload = JSON.parse(msg.payload || '{}');
      io.emit('device-update', payload);
    }
  });
});

io.on('connection', async (socket) => {
  console.log('Client connected');

  // Send initial data
  const data = await fetchDashboardData();
  socket.emit('dashboard-update', data);

  // Handle device search
  socket.on('search-device', async (query: { mac?: string; ip?: string }) => {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM devices 
        WHERE mac_address ILIKE $1 OR ip_address ILIKE $2
        LIMIT 10`,
        [`%${query.mac || ''}%`, `%${query.ip || ''}%`]
      );
      socket.emit('device-search-result', result.rows);
    } finally {
      client.release();
    }
  });

  // Handle session management
  socket.on('update-session', async (data: { sessionId: number; action: 'terminate' | 'extend'; value?: number }) => {
    const client = await pool.connect();
    try {
      if (data.action === 'terminate') {
        await client.query(
          'UPDATE sessions SET end_time = NOW() WHERE id = $1',
          [data.sessionId]
        );
      } else if (data.action === 'extend' && data.value) {
        await client.query(
          'UPDATE sessions SET time_remaining = time_remaining + $1 WHERE id = $2',
          [data.value, data.sessionId]
        );
      }
      // Notify about session changes
      await client.query('NOTIFY session_changes');
    } finally {
      client.release();
    }
  });

  // Handle device management
  socket.on('update-device', async (data: { macAddress: string; action: 'ban' | 'unban' }) => {
    const client = await pool.connect();
    try {
      const status = data.action === 'ban' ? 'blacklisted' : 'active';
      await client.query(
        'UPDATE devices SET status = $1 WHERE mac_address = $2',
        [status, data.macAddress]
      );
      // Notify about device changes
      await client.query('NOTIFY device_changes');
    } finally {
      client.release();
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.WEBSOCKET_PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});