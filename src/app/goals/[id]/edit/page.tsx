"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GoalForm from '@/components/GoalForm'; // Assuming GoalForm is in @/components

interface Goal {
  id: number;
  title: string;
  description?: string;
  specific?: string;
  motivating?: string;
  attainable?: string;
  relevant?: string;
  trackable_metrics?: string;
  level?: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'five_year';
  due_date?: string;
  status?: string;
  executor_name?: string | null;
  parent_goal_id?: number | null;
  organization_context?: string;
  llm_feedback?: string;
  // Ensure this interface matches what your API returns and GoalForm expects
}

interface GoalFormData {
  // This should match the structure GoalForm's onSave expects
  title: string;
  description?: string;
  specific?: string;
  motivating?: string;
  attainable?: string;
  relevant?: string;
  trackable_metrics?: string;
  level?: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'five_year';
  due_date?: string;
  status?: string;
  executor_name?: string | null;
  parent_goal_id?: number | null;
  organization_context?: string;
  llm_feedback?: string;
}


export default function EditGoalPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params?.id as string; // Will be a string from params

  const [initialGoal, setInitialGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (goalId) {
      const fetchGoalData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/goals/${goalId}`);
          if (!response.ok) {
            if (response.status === 404) {
              setError('Goal not found to edit.');
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || `Error fetching goal: ${response.status}`);
            }
            setInitialGoal(null);
          } else {
            const data: Goal = await response.json();
            setInitialGoal(data);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch goal data.');
          setInitialGoal(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchGoalData();
    } else {
      setError("No goal ID provided for editing.");
      setIsLoading(false);
    }
  }, [goalId]);

  const handleUpdateGoal = async (goalData: GoalFormData) => {
    setError(null);
    setSuccessMessage(null);
    if (!goalId) {
      setError("Goal ID is missing, cannot update.");
      return;
    }

    try {
      const response = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error updating goal: ${response.status}`);
      }
      const updatedGoal = await response.json();
      setSuccessMessage(`Goal "${updatedGoal.title}" updated successfully!`);
      // Optionally, refetch or update initialGoal state if staying on page
      setInitialGoal(updatedGoal); 
      setTimeout(() => {
        router.push(`/goals/${goalId}`); // Redirect to the goal detail page
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while updating.');
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading goal for editing...</div>;
  }

  if (error && !initialGoal) { // Show critical error if initial load failed
    return <div className="container mx-auto p-4 text-center text-red-600">Error: {error}</div>;
  }
  
  if (!initialGoal && !isLoading) { // Should be caught by error state, but as a fallback
     return <div className="container mx-auto p-4 text-center">Goal data could not be loaded for editing.</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Edit SMART Goal</h1>
        {initialGoal && <p className="text-xl text-slate-600">Editing: {initialGoal.title}</p>}
      </header>
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      {/* Display non-critical errors here if initialGoal loaded but subsequent save failed */}
      {error && initialGoal && ( 
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {`Failed to update goal: ${error}`}
        </div>
      )}
      
      {initialGoal && (
        <GoalForm 
            initialGoal={initialGoal} 
            onSave={handleUpdateGoal} 
            isEditing={true} 
        />
      )}
    </div>
  );
}
