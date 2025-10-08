'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CreditCardIcon, 
  PlusIcon, 
  PencilIcon, 
  StarIcon, 
  XMarkIcon,
  ClipboardIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import io, { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

interface Plan {
  _id: string;
  name: string;
  type: 'outdoor' | 'homeowner' | 'custom';
  bandwidthLimit?: number;
  timeLimit?: number;
  price: number;
  activeUsers: number;
  isDefault: boolean;
}

interface TemplateOption {
  id: string;
  name: string;
  type: 'outdoor' | 'homeowner';
}

interface PlanFormData {
  name: string;
  bandwidthLimit: number;
  timeLimit: number;
  price: number;
  type: 'custom';
}

// Constants
const TEMPLATES: TemplateOption[] = [
  { id: 'outdoor', name: 'Outdoor Hotspot Plan', type: 'outdoor' },
  { id: 'homeowner', name: 'Homeowner Monthly Plan', type: 'homeowner' }
];

const DEFAULT_FORM_DATA: PlanFormData = {
  name: '',
  bandwidthLimit: 10,
  timeLimit: 24 * 60 * 60, // 24 hours
  price: 0,
  type: 'custom'
};

// Custom hooks
const useAuthToken = () => {
  return useCallback(() => {
    const token = localStorage.getItem('authToken');
    return token ? `Bearer ${token}` : '';
  }, []);
};

const useSocket = (url: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(url);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [url]);

  return socket;
};

// Utility functions
const formatBandwidth = (mbps: number | undefined): string => {
  if (!mbps) return 'Unlimited';
  return `${mbps} Mbps`;
};

const formatDuration = (seconds: number | undefined): string => {
  if (!seconds) return 'Unlimited';

  const hours = Math.floor(seconds / 3600);
  
  if (hours >= 720) { // 30 days
    const months = Math.floor(hours / 720);
    return `${months} Month${months > 1 ? 's' : ''}`;
  } else if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} Day${days > 1 ? 's' : ''}`;
  } else {
    return `${hours} Hour${hours > 1 ? 's' : ''}`;
  }
};

const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// API functions
const createApiCaller = (getAuthToken: () => string) => {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': getAuthToken(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response;
  };

  return {
    getPlanPages: () => fetchWithAuth('/api/plan-pages'),
    applyTemplate: (templateId: string) => 
      fetchWithAuth(`/api/plan-templates/apply/${templateId}`, { method: 'POST' }),
    createCustomPlan: (data: PlanFormData) =>
      fetchWithAuth('/api/plan-templates/custom', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    setDefaultPlan: (planId: string) =>
      fetchWithAuth(`/api/plan-templates/default/${planId}`, { method: 'PUT' }),
  };
};

// Components
const PlanCard = ({ 
  plan, 
  onSetDefault 
}: { 
  plan: Plan;
  onSetDefault: (planId: string) => void;
}) => {
  const typeColors = {
    outdoor: 'bg-blue-500',
    homeowner: 'bg-green-500',
    custom: 'bg-purple-500'
  };

  return (
    <div className="relative bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl hover:shadow-black/20 group backdrop-blur-lg bg-opacity-50">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">{plan.name}</h3>
          <p className="text-sm text-gray-400 capitalize flex items-center">
            <span className={`w-2 h-2 rounded-full mr-2 ${typeColors[plan.type]}`}></span>
            {plan.type}
          </p>
        </div>
        <div className="flex space-x-2">
          {plan.isDefault ? (
            <div className="bg-yellow-500/10 text-yellow-500 p-1.5 rounded-lg">
              <StarIcon className="h-5 w-5" />
            </div>
          ) : (
            <button
              onClick={() => onSetDefault(plan._id)}
              className="text-gray-500 hover:text-yellow-500 p-1.5 hover:bg-yellow-500/10 rounded-lg transition-all duration-200"
              aria-label="Set as default"
            >
              <StarIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-500">Bandwidth</span>
          <p className="font-medium">{formatBandwidth(plan.bandwidthLimit)}</p>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Duration</span>
          <p className="font-medium">{formatDuration(plan.timeLimit)}</p>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Price</span>
          <p className="font-medium">KES {plan.price.toLocaleString()}</p>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Active Users</span>
          <p className="font-medium">{plan.activeUsers.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

const TemplateModal = ({
  isOpen,
  onClose,
  templates,
  activeTemplateId,
  generatedPageUrl,
  onApplyTemplate,
  isLoading
}: {
  isOpen: boolean;
  onClose: () => void;
  templates: TemplateOption[];
  activeTemplateId: string | null;
  generatedPageUrl: string | null;
  onApplyTemplate: (templateId: string) => void;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;

  const handleCopyUrl = async () => {
    if (!generatedPageUrl) return;
    
    const success = await copyToClipboard(generatedPageUrl);
    if (success) {
      toast.success('URL copied to clipboard!');
    } else {
      toast.error('Failed to copy URL');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Select Template</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          {templates.map((template) => (
            <div key={template.id} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-medium text-white">{template.name}</h3>
                  <p className="text-sm text-gray-400 capitalize">{template.type}</p>
                </div>
                {activeTemplateId === template.id ? (
                  <span className="text-green-400 text-sm font-medium flex items-center">
                    <span className="h-2 w-2 bg-green-400 rounded-full mr-2"></span>
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => onApplyTemplate(template.id)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {isLoading ? 'Applying...' : 'Apply'}
                  </button>
                )}
              </div>
              
              {activeTemplateId === template.id && generatedPageUrl && (
                <div className="mt-3 p-3 bg-gray-800 rounded-md border border-gray-700">
                  <label className="block text-sm text-gray-400 mb-2">Payment Page URL:</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={generatedPageUrl}
                      readOnly
                      className="flex-1 p-2 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                      title="Copy URL"
                    >
                      <ClipboardIcon className="w-4 h-4" />
                    </button>
                    <a
                      href={generatedPageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors duration-200"
                      title="Open page"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PlanModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormDataChange,
  isCustomPlan,
  isLoading = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: PlanFormData;
  onFormDataChange: (data: PlanFormData) => void;
  isCustomPlan: boolean;
  isLoading?: boolean;
}) => {
  if (!isOpen) return null;

  const handleInputChange = (field: keyof PlanFormData, value: string | number) => {
    onFormDataChange({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">
            {isCustomPlan ? 'Create Custom Plan' : 'Edit Plan'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Plan Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors duration-200"
              required
              placeholder="Enter plan name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bandwidth (Mbps)</label>
            <input
              type="number"
              value={formData.bandwidthLimit}
              onChange={(e) => handleInputChange('bandwidthLimit', Number(e.target.value))}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors duration-200"
              min="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Duration (Hours)</label>
            <input
              type="number"
              value={formData.timeLimit / 3600}
              onChange={(e) => handleInputChange('timeLimit', Number(e.target.value) * 3600)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors duration-200"
              min="0"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Price (KES)</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange('price', Number(e.target.value))}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors duration-200"
              min="0"
              step="0.01"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? 'Creating...' : isCustomPlan ? 'Create Plan' : 'Update Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
export default function PlanManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isCustomPlan, setIsCustomPlan] = useState(true);
  const [formData, setFormData] = useState<PlanFormData>(DEFAULT_FORM_DATA);
  const [generatedPageUrl, setGeneratedPageUrl] = useState<string | null>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthToken = useAuthToken();
  const socket = useSocket(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
  const api = createApiCaller(getAuthToken);

  // WebSocket effects
  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Connected to WebSocket server');
      socket.emit('get-plans');
    };

    const handlePlansData = (data: Plan[]) => {
      setPlans(data);
    };

    socket.on('connect', handleConnect);
    socket.on('plans-data', handlePlansData);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('plans-data', handlePlansData);
    };
  }, [socket]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await api.getPlanPages();
        const pages = await response.json();
        const activePage = pages.find((page: any) => page.isActive);
        
        if (activePage) {
          setActiveTemplateId(activePage.type);
          setGeneratedPageUrl(`${process.env.NEXT_PUBLIC_API2_URL}/plans/${activePage.type}`);
        }
      } catch (error) {
        console.error('Error checking active template:', error);
        toast.error('Failed to load plan pages');
      }
    };

    loadInitialData();
  }, []);

  // Event handlers
  const handleApplyTemplate = async (templateId: string) => {
    try {
      setIsLoading(true);
      await api.applyTemplate(templateId);

      const pageUrl = `${process.env.NEXT_PUBLIC_API2_URL}/plans/${templateId}`;
      setGeneratedPageUrl(pageUrl);
      setActiveTemplateId(templateId);
      setShowTemplateModal(false);

      const success = await copyToClipboard(pageUrl);
      if (success) {
        toast.success('Template applied successfully! URL copied to clipboard.');
      } else {
        toast.success('Template applied successfully!');
      }
    } catch (error: any) {
      console.error('Error applying template:', error);
      toast.error(error.message || 'Failed to apply template');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      await api.createCustomPlan(formData);
      
      setShowPlanModal(false);
      setFormData(DEFAULT_FORM_DATA);
      toast.success('Custom plan created successfully!');
    } catch (error: any) {
      console.error('Error creating custom plan:', error);
      toast.error(error.message || 'Failed to create custom plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (planId: string) => {
    try {
      await api.setDefaultPlan(planId);
      toast.success('Default plan updated successfully!');
    } catch (error: any) {
      console.error('Error setting default plan:', error);
      toast.error(error.message || 'Failed to set default plan');
    }
  };

  const handleCopyUrl = async () => {
    if (!generatedPageUrl) return;
    
    const success = await copyToClipboard(generatedPageUrl);
    if (success) {
      toast.success('URL copied to clipboard!');
    } else {
      toast.error('Failed to copy URL');
    }
  };

  const openCreatePlanModal = () => {
    setIsCustomPlan(true);
    setFormData(DEFAULT_FORM_DATA);
    setShowPlanModal(true);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold text-white">Plans Management</h1>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/20"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Apply Template
            </button>
            <button
              onClick={openCreatePlanModal}
              className="flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-purple-500/20"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Custom Plan
            </button>
          </div>
        </div>
        
        {generatedPageUrl && (
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-gray-400 text-sm mb-1">Plan Page URL:</p>
                <p className="text-blue-400 font-mono text-sm truncate">{generatedPageUrl}</p>
              </div>
            <div className="flex gap-7">
             <button
  onClick={() => {
    if (generatedPageUrl) {
      window.open(generatedPageUrl, '_blank', 'noopener,noreferrer');
    }
  }}
  disabled={!generatedPageUrl}
  className="px-4 text-blue-400 hover:text-blue-300 py-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
  title="Open page"
>
  Open Page
</button>
              <button
                onClick={handleCopyUrl}
                className="flex items-center px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm transition-colors duration-200 shrink-0"
              >
                <ClipboardIcon className="h-4 w-4 mr-1" />
                Copy URL
              </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No plans available</div>
          <button
            onClick={openCreatePlanModal}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
          >
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard 
              key={plan._id} 
              plan={plan} 
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        templates={TEMPLATES}
        activeTemplateId={activeTemplateId}
        generatedPageUrl={generatedPageUrl}
        onApplyTemplate={handleApplyTemplate}
        isLoading={isLoading}
      />

      <PlanModal
        isOpen={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        onFormDataChange={setFormData}
        isCustomPlan={isCustomPlan}
        isLoading={isLoading}
      />
    </div>
  );
}