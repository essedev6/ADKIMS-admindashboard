'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Plan {
  price: number;
  duration?: string;
  timeUnit?: string;
  bandwidth?: number;
}

interface PlanTemplate {
  id: string;
  name: string;
  type: 'outdoor' | 'homeowner';
  plans: Plan[];
}

export default function PlanTemplateComponent() {
  const [templates] = useState<PlanTemplate[]>([
    {
      id: 'outdoor',
      name: 'Outdoor Hotspot Plan',
      type: 'outdoor',
      plans: [
        { price: 5, duration: '30', timeUnit: 'mins' },
        { price: 10, duration: '3', timeUnit: 'hrs' },
        { price: 20, duration: '7', timeUnit: 'hrs' },
        { price: 39, duration: '12', timeUnit: 'hrs' },
        { price: 75, duration: '24', timeUnit: 'hrs' },
        { price: 130, duration: '3', timeUnit: 'days' },
        { price: 375, duration: '7', timeUnit: 'days' },
        { price: 950, duration: '1', timeUnit: 'month' }
      ]
    },
    {
      id: 'homeowner',
      name: 'Homeowner Monthly Plan',
      type: 'homeowner',
      plans: [
        { price: 1999, bandwidth: 10 },
        { price: 2999, bandwidth: 20 },
        { price: 3999, bandwidth: 30 },
        { price: 4999, bandwidth: 50 }
      ]
    }
  ]);

  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [generatedPageUrl, setGeneratedPageUrl] = useState<string | null>(null);

  const applyTemplate = async (templateId: string) => {
    try {
      // First apply the template
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plan-templates/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ templateId })
      });

      if (!response.ok) {
        throw new Error('Failed to apply template');
      }

      // Get the generated page URL
      const pageUrl = `${window.location.origin}/template-plans/${templateId}`;
      setGeneratedPageUrl(pageUrl);
      setActiveTemplate(templateId);

      // Show success message with the URL
      toast.success('Plan page generated successfully!', {
        duration: 5000,
      });

    } catch (error) {
      console.error('Error applying template:', error);
      toast.error('Failed to generate plan page');
    }
  };

  useEffect(() => {
    // Check which template is active on load
    const checkActiveTemplate = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/plan-pages`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (response.ok) {
          const pages = await response.json();
          const activePage = pages.find((page: any) => page.isActive);
          if (activePage) {
            setActiveTemplate(activePage.type);
            setGeneratedPageUrl(`${window.location.origin}/template-plans/${activePage.type}`);
          }
        }
      } catch (error) {
        console.error('Error checking active template:', error);
      }
    };

    checkActiveTemplate();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Plan Templates</h2>
        <p className="text-gray-600">
          Select a template to generate a payment page for your users.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`p-6 rounded-lg border-2 transition-all ${
              activeTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <h3 className="text-xl font-semibold mb-4">{template.name}</h3>
            <div className="space-y-2 mb-6">
              {template.plans.map((plan, index) => (
                <div key={index} className="text-sm text-gray-600">
                  • {plan.bandwidth 
                      ? `${plan.bandwidth}Mbps - KES ${plan.price}`
                      : `${plan.duration} ${plan.timeUnit} - KES ${plan.price}`}
                </div>
              ))}
            </div>

            {activeTemplate === template.id ? (
              <div className="space-y-4">
                <div className="flex items-center">
                  <span className="flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-green-600 font-medium">Active Template</span>
                </div>
                {generatedPageUrl && (
                  <div className="flex flex-col space-y-2">
                    <span className="text-sm text-gray-600">Payment Page URL:</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={generatedPageUrl}
                        readOnly
                        className="flex-1 p-2 text-sm bg-white border rounded"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(generatedPageUrl);
                          toast.success('URL copied to clipboard!');
                        }}
                        className="p-2 text-blue-600 hover:text-blue-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </button>
                      <a
                        href={generatedPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-blue-600 hover:text-blue-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => applyTemplate(template.id)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Apply Template
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}