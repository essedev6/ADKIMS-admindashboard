import React, { useState, useEffect } from 'react';
import { ChartBarIcon, UsersIcon, CreditCardIcon, WifiIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { useWebSocket } from '../contexts/WebSocketContext';
import ActiveSessionsTable from './ActiveSessionsTable';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  bgColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon: Icon, bgColor }) => (
  <div className={`backdrop-blur-card p-6 rounded-2xl flex items-center justify-between ${bgColor}`}>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
    <Icon className="w-8 h-8 text-white/60" />
  </div>
);

interface QuickActionProps {
  title: string;
  icon: React.ElementType;
  onClick: () => void;
}

const QuickAction: React.FC<QuickActionProps> = ({ title, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="backdrop-blur-card p-4 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-blue-500/10 transition-colors"
  >
    <Icon className="w-6 h-6 text-blue-400 mb-2" />
    <p className="text-sm font-medium">{title}</p>
  </button>
);

interface RevenueData {
  name: string;
  revenue: number;
}

interface BandwidthData {
  hour: string;
  usage: number;
}

interface DeviceStats {
  total: number;
  active: number;
  blacklisted: number;
}

interface DashboardData {
  totalRevenue: number;
  totalTransactions: number;
  activeUsers: number;
  revenueByPlan: RevenueData[];
  bandwidthUsage: BandwidthData[];
  deviceStats: DeviceStats;
}

const DashboardOverview: React.FC = () => {
  const { socket } = useWebSocket();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalRevenue: 0,
    totalTransactions: 0,
    activeUsers: 0,
    revenueByPlan: [],
    bandwidthUsage: [],
    deviceStats: { total: 0, active: 0, blacklisted: 0 },
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/payment/dashboard-data');
        const data = await response.json();
        console.log('Fetched dashboard data:', data);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();

    if (socket) {
      socket.on('dashboard-update', (data: DashboardData) => {
        setDashboardData(data);
      });
    }

    return () => {
      if (socket) {
        socket.off('dashboard-update');
      }
    };
  }, [socket]);

  // Dummy data for charts if no real data is available
  const dummyRevenueData: RevenueData[] = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 3000 },
    { name: 'Mar', revenue: 5000 },
    { name: 'Apr', revenue: 4500 },
    { name: 'May', revenue: 6000 },
    { name: 'Jun', revenue: 5500 },
  ];

  const dummyBandwidthData: BandwidthData[] = [
    { hour: '00:00', usage: 200 },
    { hour: '03:00', usage: 220 },
    { hour: '06:00', usage: 280 },
    { hour: '09:00', usage: 350 },
    { hour: '12:00', usage: 400 },
    { hour: '15:00', usage: 380 },
    { hour: '18:00', usage: 450 },
    { hour: '21:00', usage: 420 },
  ];

  return (
    <div className="min-h-screen bg-[#020817] text-white p-6 w-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-blue-300/80 mt-2">Welcome to your ADKIMS HOTSPOT admin dashboard</p>
      </div>

      {/* Metric Cards - Full Width Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Revenue"
          value={`KES ${(dashboardData.totalRevenue || 0).toLocaleString()}`}
          icon={CreditCardIcon}
          bgColor="bg-gradient-to-r from-blue-800 to-blue-600"
          textColor="text-white"
        />
        <MetricCard
          title="Total Transactions"
          value={(dashboardData.totalTransactions || 0).toLocaleString()}
          icon={ChartBarIcon}
          bgColor="bg-gradient-to-r from-green-800 to-green-600"
        />
        <MetricCard
          title="Active Users"
          value={(dashboardData.activeUsers || 0).toLocaleString()}
          icon={UsersIcon}
          bgColor="bg-gradient-to-r from-purple-800 to-purple-600"
        />
        <MetricCard
          title="Active Devices"
          value={((dashboardData.deviceStats?.active) || 0).toLocaleString()}
          icon={DevicePhoneMobileIcon}
          bgColor="bg-gradient-to-r from-yellow-800 to-yellow-600"
        />
      </div>

      {/* Charts Section - Full Width */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="backdrop-blur-card p-6 rounded-2xl border border-blue-500/20">
          <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart 
              data={dashboardData.revenueByPlan?.length > 0 ? dashboardData.revenueByPlan : dummyRevenueData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.2)" />
              <XAxis 
                dataKey="name" 
                stroke="#9ca3af" 
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={12}
                tickFormatter={(value) => `KES ${value}`}
              />
              <Tooltip
                formatter={(value) => [`KES ${value}`, 'Revenue']}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '8px'
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                fill="#3b82f6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bandwidth Chart */}
        <div className="backdrop-blur-card p-6 rounded-2xl border border-blue-500/20">
          <h3 className="text-lg font-semibold mb-4">Bandwidth Usage (Last 24h)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={dashboardData.bandwidthUsage?.length > 0 ? dashboardData.bandwidthUsage : dummyBandwidthData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(59, 130, 246, 0.2)" />
              <XAxis 
                dataKey="hour" 
                stroke="#9ca3af" 
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={12}
                tickFormatter={(value) => `${value} Mbps`}
              />
              <Tooltip
                formatter={(value) => [`${value} Mbps`, 'Usage']}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: 'none', 
                  borderRadius: '8px'
                }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Line 
                type="monotone" 
                dataKey="usage" 
                stroke="#84cc16" 
                strokeWidth={2}
                activeDot={{ r: 6, fill: '#84cc16' }}
                dot={{ r: 2, fill: '#84cc16' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Sessions Table */}
      <div className="backdrop-blur-card p-6 rounded-2xl border border-blue-500/20 mb-8">
        <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
        <ActiveSessionsTable />
      </div>

      {/* System Health and Quick Actions - Full Width */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* System Health - Takes 2/3 width */}
        <div className="backdrop-blur-card p-6 rounded-2xl border border-blue-500/20 xl:col-span-2">
          <h3 className="text-lg font-semibold mb-4">System Health</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300">Database Status:</p>
              <span className="text-green-400 font-medium">Operational</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300">API Latency:</p>
              <span className="text-yellow-400 font-medium">75ms</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300">Server Load:</p>
              <span className="text-green-400 font-medium">25%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
              <p className="text-gray-300">Disk Usage:</p>
              <span className="text-red-400 font-medium">85%</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="backdrop-blur-card p-6 rounded-2xl border border-blue-500/20">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickAction 
              title="Add New User" 
              icon={UsersIcon} 
              onClick={() => console.log('Add New User')} 
            />
            <QuickAction 
              title="Create Voucher" 
              icon={CreditCardIcon} 
              onClick={() => console.log('Create Voucher')} 
            />
            <QuickAction 
              title="Restart Service" 
              icon={WifiIcon} 
              onClick={() => console.log('Restart Service')} 
            />
            <QuickAction 
              title="View Logs" 
              icon={ChartBarIcon} 
              onClick={() => console.log('View Logs')} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;