'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlanCard from '../../app/components/plans/PlanCard';

interface Plan {
  id: string;
  name: string;
  price: number;
  bandwidthLimit?: number;
  timeLimit?: number;
  description?: string;
  features?: string[];
  isActive?: boolean;
}

export default function PlansManagementPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('outdoor');

  useEffect(() => {
    fetchPlans();
  }, [selectedType]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plan-pages/${selectedType}`);
      if (!response.ok) throw new Error('Failed to fetch plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlan = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plans/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) throw new Error('Failed to update plan');
      
      setPlans(plans.map(plan => 
        plan.id === id ? { ...plan, isActive } : plan
      ));
    } catch (err) {
      console.error('Error updating plan:', err);
      alert('Failed to update plan status');
    }
  };

  const handleEditPlan = (id: string) => {
    // Navigate to edit page or open modal
    window.location.href = `/plans/edit/${id}`;
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete plan');
      
      setPlans(plans.filter(plan => plan.id !== id));
    } catch (err) {
      console.error('Error deleting plan:', err);
      alert('Failed to delete plan');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="bg-red-50 p-4 rounded-lg text-red-800">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Plan Management</h1>
          <button
            onClick={() => window.location.href = '/plans/new'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add New Plan
          </button>
        </div>

        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedType('outdoor')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedType === 'outdoor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Outdoor Plans
            </button>
            <button
              onClick={() => setSelectedType('indoor')}
              className={`px-4 py-2 rounded-lg font-medium ${
                selectedType === 'indoor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Indoor Plans
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onToggle={handleTogglePlan}
                onEdit={handleEditPlan}
                onDelete={handleDeletePlan}
              />
            ))}
          </AnimatePresence>
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No plans found. Create your first plan to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}