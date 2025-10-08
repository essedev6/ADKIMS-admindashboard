'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    price: number;
    bandwidthLimit?: number;
    timeLimit?: number;
    description?: string;
    features?: string[];
    isActive?: boolean;
  };
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function PlanCard({ plan, onToggle, onEdit, onDelete }: PlanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this plan?')) {
      setIsDeleting(true);
      try {
        await onDelete(plan.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onToggle(plan.id, !plan.isActive)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                plan.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {plan.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <span className="text-2xl font-bold text-blue-600">
            {new Intl.NumberFormat('en-KE', {
              style: 'currency',
              currency: 'KES',
            }).format(plan.price)}
          </span>
        </div>

        {plan.description && (
          <p className="text-gray-600 text-sm mb-4">{plan.description}</p>
        )}

        <div className="space-y-2 mb-6">
          {plan.bandwidthLimit && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Up to {plan.bandwidthLimit}Mbps
            </div>
          )}
          {plan.timeLimit && (
            <div className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatDuration(plan.timeLimit)}
            </div>
          )}
          {plan.features?.map((feature, index) => (
            <div key={index} className="flex items-center text-sm text-gray-600">
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
          <button
            onClick={() => onEdit(plan.id)}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds >= 2592000) {
    const months = Math.floor(seconds / 2592000);
    return `${months} ${months === 1 ? 'Month' : 'Months'}`;
  } else if (seconds >= 604800) {
    const weeks = Math.floor(seconds / 604800);
    return `${weeks} ${weeks === 1 ? 'Week' : 'Weeks'}`;
  } else if (seconds >= 86400) {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? 'Day' : 'Days'}`;
  } else if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? 'Hour' : 'Hours'}`;
  } else {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? 'Minute' : 'Minutes'}`;
  }
}