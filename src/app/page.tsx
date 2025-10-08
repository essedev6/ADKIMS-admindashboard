'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChartBarIcon, UsersIcon, CreditCardIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ClockIcon, WifiIcon, DevicePhoneMobileIcon, DocumentTextIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import UserManagement from './components/UserManagement';
import PlanManagement from './components/PlanManagement';
import Settings from './components/Settings';
import SessionLogs from './components/SessionLogs';
import RealtimeSessions from './components/RealtimeSessions';
import ActiveSessionsTable from './components/ActiveSessionsTable';
import DashboardOverview from './components/DashboardOverview';
import { useWebSocket } from './contexts/WebSocketContext';

declare global {
  interface Window {
    electron: {
      navigate: (route: string) => void;
      onNavigate: (callback: (event: any, route: string) => void) => void;
    };
  }
}

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

export default function Home() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [userData, setUserData] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isConnected } = useWebSocket();
  const router = useRouter();

  useEffect(() => {
    const authToken = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');
    
    if (!authToken) {
      router.push('/login');
      return;
    }

    if (storedUserData) {
      try {
        setUserData(JSON.parse(storedUserData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, [router]);

  const handleLogout = async () => {
    try {
      // Optional: Call logout API endpoint if you have one
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api'}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }).catch(error => {
          console.error('Logout API call failed:', error);
          // Continue with client-side logout even if API call fails
        });
      }

      // Clear all authentication data from localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      // Clear any other related data
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('auth_') || key === 'token' || key === 'user') {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Redirect to login page
      router.push('/login');
      
      // Force a hard refresh to ensure all state is cleared
      setTimeout(() => {
        window.location.reload();
      }, 100);

    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: clear storage and redirect anyway
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      router.push('/login');
    }
  };

  const handleNavigation = (route: string) => {
    setActiveNav(route);
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
    if (window.electron) {
      window.electron.navigate(route);
    } else {
      window.location.hash = route;
    }
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    if (userData?.username) {
      return userData.username.charAt(0).toUpperCase();
    }
    if (userData?.email) {
      return userData.email.charAt(0).toUpperCase();
    }
    return 'A';
  };

  // Get display name
  const getDisplayName = () => {
    if (userData?.username) {
      return userData.username;
    }
    if (userData?.email) {
      return userData.email.split('@')[0];
    }
    return 'Admin';
  };

  return (
    <div className="min-h-screen bg-[#020817] text-white">
      <div className="flex flex-col lg:flex-row">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-blue-500/20">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            ABS
          </h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-400 hidden xs:inline">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Sidebar - Hidden on mobile, shown when menu is open */}
        <nav className={`
          ${isMobileMenuOpen ? 'fixed inset-0 z-50 bg-[#020817]' : 'hidden'} 
          lg:flex lg:relative lg:w-64 backdrop-blur-card p-6 h-screen flex-col border-r border-blue-500/20
        `}>
          {/* Mobile header inside sidebar */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              ADKIMS BILLING SYSTEM (ABS)
            </h1>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Desktop header */}
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-8 hidden lg:block">
            ADKIMS BILLING SYSTEM (ABS)
          </h1>

          <div className="flex-1 space-y-2">
            <button
              onClick={() => handleNavigation('dashboard')}
              className={`nav-button ${activeNav === 'dashboard' ? 'nav-button-active' : 'nav-button-inactive'} w-full justify-start`}
            >
              <ChartBarIcon className="w-5 h-5" />
              <span className="ml-3">Dashboard</span>
            </button>
            <button
              onClick={() => handleNavigation('sessions')}
              className={`nav-button ${activeNav === 'sessions' ? 'nav-button-active' : 'nav-button-inactive'} w-full justify-start`}
            >
              <ClockIcon className="w-5 h-5" />
              <span className="ml-3">Active Sessions</span>
            </button>
            <button
              onClick={() => handleNavigation('session-logs')}
              className={`nav-button ${activeNav === 'session-logs' ? 'nav-button-active' : 'nav-button-inactive'} w-full justify-start`}
            >
              <DocumentTextIcon className="w-5 h-5" />
              <span className="ml-3">Session Logs</span>
            </button>
            <button
              onClick={() => handleNavigation('devices')}
              className={`nav-button ${activeNav === 'devices' ? 'nav-button-active' : 'nav-button-inactive'} w-full justify-start`}
            >
              <DevicePhoneMobileIcon className="w-5 h-5" />
              <span className="ml-3">Devices</span>
            </button>
            <button
              onClick={() => handleNavigation('users')}
              className={`nav-button ${activeNav === 'users' ? 'nav-button-active' : 'nav-button-inactive'} w-full justify-start`}
            >
              <UsersIcon className="w-5 h-5" />
              <span className="ml-3">Users</span>
            </button>
            <button
              onClick={() => handleNavigation('plans')}
              className={`nav-button ${activeNav === 'plans' ? 'nav-button-active' : 'nav-button-inactive'} w-full justify-start`}
            >
              <CreditCardIcon className="w-5 h-5" />
              <span className="ml-3">Plans</span>
            </button>
            <button
              onClick={() => handleNavigation('settings')}
              className={`nav-button ${activeNav === 'settings' ? 'nav-button-active' : 'nav-button-inactive'} w-full justify-start`}
            >
              <Cog6ToothIcon className="w-5 h-5" />
              <span className="ml-3">Settings</span>
            </button>
          </div>

          {/* User Info for Mobile */}
          <div className="lg:hidden mb-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <span className="text-blue-400 font-semibold">{getUserInitial()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{getDisplayName()}</p>
                {userData?.role && (
                  <p className="text-sm text-blue-400 truncate">{userData.role}</p>
                )}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="nav-button text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-200 w-full justify-start"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="ml-3">Logout</span>
          </button>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-blue-500/20 gap-4">
            <h2 className="text-xl sm:text-2xl font-semibold">
              {activeNav === 'dashboard' && 'Dashboard Overview'}
              {activeNav === 'sessions' && 'Active Sessions'}
              {activeNav === 'session-logs' && 'Session Logs'}
              {activeNav === 'devices' && 'Device Management'}
              {activeNav === 'users' && 'User Management'}
              {activeNav === 'plans' && 'Plan Management'}
              {activeNav === 'settings' && 'System Settings'}
            </h2>
            <div className="flex items-center gap-4 justify-between sm:justify-end">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-400 hidden sm:inline">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <span className="text-gray-400 hidden md:inline">{getDisplayName()}</span>
              {userData?.role && (
                <span className="text-sm bg-blue-500/20 text-blue-400 px-2 py-1 rounded hidden sm:inline">
                  {userData.role}
                </span>
              )}
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <span className="text-blue-400 font-semibold text-sm sm:text-base">{getUserInitial()}</span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="h-[calc(100vh-140px)] sm:h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] overflow-y-auto p-4 sm:p-6">
            {activeNav === 'dashboard' && <DashboardOverview />}
            {activeNav === 'sessions' && <RealtimeSessions />}
            {activeNav === 'session-logs' && <SessionLogs />}
            {activeNav === 'users' && <UserManagement />}
            {activeNav === 'plans' && <PlanManagement />}
            {activeNav === 'settings' && <Settings />}
          </div>
        </main>
      </div>
    </div>
  );
}