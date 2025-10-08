'use client';

import { useState, useEffect } from 'react';
import { UsersIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import UserProfileModal from './UserProfileModal';
// import io from 'socket.io-client'; // Remove WebSocket import

interface User {
  _id: string; // Changed from id: number to _id: string to match MongoDB
  username: string; // Changed from name to username
  email: string;
  status: 'active' | 'inactive' | 'suspended'; // Added 'suspended'
  plan: { // Changed from plan_id to nested plan object
    _id: string;
    name: string;
  };
  createdAt: string; // Changed from created_at to createdAt
  lastLogin: string | null; // Changed from last_login to lastLogin
}

interface Plan {
  _id: string; // Changed from id: number to _id: string
  name: string;
  bandwidthLimit: number; // Changed from bandwidth_limit to bandwidthLimit
  timeLimit: number; // Changed from time_limit to timeLimit
  price: number;
  description: string; // Added description
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPaymentHistoryModal, setShowPaymentHistoryModal] = useState(false);
  const [selectedUserPayments, setSelectedUserPayments] = useState<any[]>([]);
  const [showSessionHistoryModal, setShowSessionHistoryModal] = useState(false);
  const [selectedUserSessions, setSelectedUserSessions] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    plan: '',
    status: 'active',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | 'suspended' | ''>('');
  const [showUserProfileModal, setShowUserProfileModal] = useState<boolean>(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

  // TODO: Implement a secure way to get the authentication token
  const getAuthToken = () => {
    // Attempt to retrieve token from localStorage
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      return storedToken;
    }
    return null;
  };

  const handleEditUser = (user: User) => {
    setSelectedUserForProfile(user);
    setShowUserProfileModal(true);
  };

  const handleCloseProfileModal = () => {
    setShowUserProfileModal(false);
    setSelectedUserForProfile(null);
  };

  const handleSaveUserProfile = async (updatedUser: User) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('Authentication token not found.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/${updatedUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to update user.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          const textError = await response.text();
          if (textError === 'Forbidden') {
            errorMessage = 'You do not have permission to perform this action.';
          } else {
            errorMessage = `Server error: ${textError}`;
          }
        }
        setError(errorMessage);
        return;
      }

      const data = await response.json();
      setUsers(prevUsers => prevUsers.map(user => (user._id === data._id ? data : user)));
      setShowUserProfileModal(false);
      setSelectedUserForProfile(null);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error updating user profile:', error);
      setError('An unexpected error occurred.');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchPlans();
  }, [searchQuery, filterStatus]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      if (filterStatus) {
        queryParams.append('status', filterStatus);
      }
      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/users${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setUsers(result.data.users);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/plans`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setPlans(result.data);
    } catch (err: any) {
      console.error('Failed to fetch plans:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const method = selectedUser ? 'PUT' : 'POST';
    const url = selectedUser ? `${API_BASE_URL}/users/${selectedUser._id}` : `${API_BASE_URL}/users`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await response.json();
      setShowUserModal(false);
      setSelectedUser(null);
      setFormData({ username: '', email: '', plan: '', status: 'active' });
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      plan: user.plan._id,
      status: user.status,
    });
    setShowUserModal(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        fetchUsers(); // Refresh user list
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const handleToggleStatus = async (userId: string, newStatus: 'active' | 'inactive') => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchUsers(); // Refresh user list
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleViewPayments = async (userId: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/payments`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSelectedUserPayments(data.payments || []); // Fixed: Ensure it's always an array
      setShowPaymentHistoryModal(true);
    } catch (err: any) {
      setError(err.message);
      setSelectedUserPayments([]); // Ensure it's always an array on error
    }
  };

  const handleViewSessions = async (userId: string) => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/sessions`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      setSelectedUserSessions(result.data?.sessions || []); // Fixed: Ensure it's always an array
      setShowSessionHistoryModal(true);
    } catch (err: any) {
      console.error("Error fetching user sessions:", err);
      setError(err.message);
      setSelectedUserSessions([]); // Ensure it's always an array on error
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDuration = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return <div className="text-center text-white">Loading users...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <UsersIcon className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold">User Management</h2>
        </div>
        <div className="flex items-center gap-3">
          <input
            key="user-search-input"
            type="text"
            placeholder="Search users..."
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as '' | 'active' | 'inactive' | 'suspended')}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          onClick={() => {
            setSelectedUser(null);
            setFormData({ username: '', email: '', plan: '', status: 'active' });
            setShowUserModal(true);
          }}
        >
          <PlusIcon className="w-5 h-5" />
          Add User
        </button>
      </div>

      <div className="backdrop-blur-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-blue-500/20">
                <th className="text-left p-4 text-gray-400 font-medium">Username</th>
                <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                <th className="text-left p-4 text-gray-400 font-medium">Plan</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Last Login</th>
                <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-blue-500/10 last:border-0">
                  <td className="p-4">{user.username}</td>
                  <td className="p-4">{user.email}</td>
                  <td className="p-4">
                    {user.plan?.name || 'Unknown Plan'}
                  </td>
                  <td className="p-4">
                    <span className={`status-badge ${user.status === 'active' ? 'status-badge-active' : user.status === 'suspended' ? 'status-badge-suspended' : 'status-badge-inactive'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-400">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleEditUser(user)}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(user._id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                    <button
                      className="btn btn-info"
                      onClick={() => handleToggleStatus(user._id, user.status === 'active' ? 'inactive' : 'active')}
                    >
                      {user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleViewPayments(user._id)}
                    >
                      Payments
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleViewSessions(user._id)}
                    >
                      Sessions
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="backdrop-blur-card p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-6">
              {selectedUser ? 'Edit User' : 'Add New User'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-gray-400 mb-2">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-gray-400 mb-2">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                  required
                />
              </div>
              <div>
                <label htmlFor="plan" className="block text-gray-400 mb-2">Plan</label>
                <select
                  id="plan"
                  name="plan"
                  value={formData.plan}
                  onChange={handleInputChange}
                  className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="">Select a Plan</option>
                  {plans.map((plan) => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name} - {formatBytes(plan.bandwidthLimit)}/
                      {formatDuration(plan.timeLimit)} - ${plan.price}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-gray-400 mb-2">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500/50"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setFormData({ username: '', email: '', plan: '', status: 'active' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {selectedUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Payment History</h2>
            {/* FIXED: Added null check for selectedUserPayments */}
            {!selectedUserPayments || selectedUserPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No payment history found for this user.</p>
            ) : (
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Amount</th>
                    <th className="py-2 px-4 border-b">Date</th>
                    <th className="py-2 px-4 border-b">Status</th>
                    <th className="py-2 px-4 border-b">Transaction ID</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUserPayments.map((payment, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 border-b">{payment.amount}</td>
                      <td className="py-2 px-4 border-b">{new Date(payment.date).toLocaleString()}</td>
                      <td className="py-2 px-4 border-b">{payment.status}</td>
                      <td className="py-2 px-4 border-b">{payment.transactionId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              className="mt-4 btn btn-primary"
              onClick={() => setShowPaymentHistoryModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showSessionHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-2/3 lg:w-1/2 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Session History</h2>
            {/* FIXED: Added null check for selectedUserSessions */}
            {!selectedUserSessions || selectedUserSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No session history found for this user.</p>
            ) : (
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Start Time</th>
                    <th className="py-2 px-4 border-b">End Time</th>
                    <th className="py-2 px-4 border-b">Duration</th>
                    <th className="py-2 px-4 border-b">IP Address</th>
                    <th className="py-2 px-4 border-b">MAC Address</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUserSessions.map((session, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 border-b">{new Date(session.startTime).toLocaleString()}</td>
                      <td className="py-2 px-4 border-b">{session.endTime ? new Date(session.endTime).toLocaleString() : 'Active'}</td>
                      <td className="py-2 px-4 border-b">{session.duration || 'N/A'}</td>
                      <td className="py-2 px-4 border-b">{session.ipAddress}</td>
                      <td className="py-2 px-4 border-b">{session.macAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <button
              className="mt-4 btn btn-primary"
              onClick={() => setShowSessionHistoryModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <UserProfileModal
        showModal={showUserProfileModal}
        onClose={handleCloseProfileModal}
        user={selectedUserForProfile}
        onSave={handleSaveUserProfile}
      />
    </div>
  );
}