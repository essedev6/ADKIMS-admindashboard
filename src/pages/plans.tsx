import React, { useEffect, useState } from 'react';

interface PlanTemplate {
  _id: string;
  name: string;
  type: string;
  plans: Array<{
    price: number;
    duration?: string;
    timeUnit?: string;
    bandwidth?: number;
  }>;
}

const PlansPage = () => {
  const [planTemplates, setPlanTemplates] = useState<PlanTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanTemplates = async () => {
      try {
        const response = await fetch('/api/plan-templates'); // Assuming API endpoint
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPlanTemplates(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlanTemplates();
  }, []);

  if (loading) {
    return <div>Loading plan templates...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Plan Management</h1>
      <h2>Available Plan Templates</h2>
      {planTemplates.length === 0 ? (
        <p>No plan templates found.</p>
      ) : (
        <ul>
          {planTemplates.map((template) => (
            <li key={template._id}>
              <h3>{template.name} ({template.type})</h3>
              <ul>
                {template.plans.map((plan, index) => (
                  <li key={index}>
                    Price: ${plan.price}
                    {plan.bandwidth && `, Bandwidth: ${plan.bandwidth}Mbps`}
                    {plan.duration && plan.timeUnit && `, Duration: ${plan.duration} ${plan.timeUnit}`}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlansPage;