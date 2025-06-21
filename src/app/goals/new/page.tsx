"use client";

import GoalForm from '@/components/GoalForm';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface GoalFormData {
  title: string;
  description?: string;
  specific?: string;
  motivating?: string;
  attainable?: string;
  relevant?: string;
  trackable_metrics?: string;
  level?: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'five_year';
  due_date?: string;
  executor_name?: string;
  parent_goal_id?: number;
  organization_context?: string;
}

export default function NewGoalPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSaveGoal = async (goalData: GoalFormData) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}`);
      }
      const newGoal = await response.json();
      setSuccessMessage(`Goal "${newGoal.title}" created successfully!`);
      // Optionally, redirect after a short delay or on button click
      setTimeout(() => {
        router.push('/'); // Redirect to homepage or goal list page
        // Or router.push(`/goals/${newGoal.id}`); to go to the new goal's detail page
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Create New SMART Goal</h1>
      </header>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {`Failed to create goal: ${error}`}
        </div>
      )}
      
      <GoalForm onSave={handleSaveGoal} />
    </div>
  );
}
