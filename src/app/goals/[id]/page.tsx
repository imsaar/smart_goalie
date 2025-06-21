"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Goal {
  id: number;
  title: string;
  description?: string;
  specific?: string;
  motivating?: string;
  attainable?: string;
  relevant?: string;
  trackable_metrics?: string;
  status?: string;
  level?: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'five_year';
  due_date?: string;
  created_at?: string;
  updated_at?: string;
  executor_name?: string;
  parent_goal_id?: number;
  llm_feedback?: string;
  organization_context?: string;
  // Add other fields as necessary from your API response
}

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params?.id;

  const [goal, setGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);

  useEffect(() => {
    if (goalId) {
      const fetchGoal = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/goals/${goalId}`);
          if (!response.ok) {
            if (response.status === 404) {
              setError('Goal not found.');
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || `Error: ${response.status}`);
            }
            setGoal(null);
          } else {
            const data: Goal = await response.json();
            setGoal(data);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to fetch goal details.');
          setGoal(null);
          console.error("Error fetching goal details:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchGoal();
    } else {
      // Handle case where goalId is not available, though useParams should provide it
      setError("No goal ID provided in the URL.");
      setIsLoading(false);
    }
  }, [goalId]);

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading goal details...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-600">Error: {error}</div>;
  }

  if (!goal) {
    return <div className="container mx-auto p-4 text-center">Goal not found or no details available.</div>;
  }

  const detailItemClass = "py-2";
  const labelClass = "font-semibold text-slate-600";
  const valueClass = "text-slate-800 ml-2";

  const handleGetLlmFeedback = async () => {
    if (!goal) {
      setError("Goal data is not available to analyze.");
      return;
    }
    setLlmLoading(true);
    // setError(null); // Clear previous general errors, or use a specific llmError state
    try {
      const response = await fetch('/api/goals/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goal.title,
          description: goal.description,
          specific: goal.specific,
          motivating: goal.motivating,
          attainable: goal.attainable,
          relevant: goal.relevant,
          trackable_metrics: goal.trackable_metrics,
        }),
      });
      const data = await response.json(); // Try to parse JSON regardless of response.ok for error messages
      if (!response.ok) {
        throw new Error(data.error || `Error ${response.status}`);
      }
      setGoal(prev => prev ? ({ ...prev, llm_feedback: data.feedback }) : null);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get LLM feedback.';
        // setError(errorMessage); // Set general error, or update llm_feedback with error
        setGoal(prev => prev ? ({ ...prev, llm_feedback: `Error during analysis: ${errorMessage}` }) : null);
    } finally {
      setLlmLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 mb-2">{goal.title}</h1>
        <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
                Last updated: {goal.updated_at ? new Date(goal.updated_at).toLocaleString() : 'N/A'}
            </p>
            <Link href={`/goals/${goal.id}/edit`} className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition duration-150 ease-in-out">
                Edit Goal
            </Link>
        </div>
      </header>

      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        {goal.description && <div className={detailItemClass}><span className={labelClass}>Description:</span><p className={`${valueClass} mt-1 whitespace-pre-wrap`}>{goal.description}</p></div>}
        
        <h2 className="text-2xl font-semibold text-slate-700 mt-6 mb-4 border-b pb-2">SMART Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {goal.specific && <div className={detailItemClass}><span className={labelClass}>Specific:</span><p className={valueClass}>{goal.specific}</p></div>}
            {goal.motivating && <div className={detailItemClass}><span className={labelClass}>Motivating:</span><p className={valueClass}>{goal.motivating}</p></div>}
            {goal.attainable && <div className={detailItemClass}><span className={labelClass}>Attainable:</span><p className={valueClass}>{goal.attainable}</p></div>}
            {goal.relevant && <div className={detailItemClass}><span className={labelClass}>Relevant:</span><p className={valueClass}>{goal.relevant}</p></div>}
            {goal.trackable_metrics && <div className={detailItemClass}><span className={labelClass}>Trackable Metrics:</span><p className={valueClass}>{goal.trackable_metrics}</p></div>}
        </div>

        <h2 className="text-2xl font-semibold text-slate-700 mt-6 mb-4 border-b pb-2">Goal Attributes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {goal.status && <div className={detailItemClass}><span className={labelClass}>Status:</span><span className={valueClass}>{goal.status}</span></div>}
            {goal.level && <div className={detailItemClass}><span className={labelClass}>Level:</span><span className={valueClass}>{goal.level}</span></div>}
            {goal.due_date && <div className={detailItemClass}><span className={labelClass}>Due Date:</span><span className={valueClass}>{new Date(goal.due_date).toLocaleDateString()}</span></div>}
            {goal.executor_name && <div className={detailItemClass}><span className={labelClass}>Owner:</span><span className={valueClass}>{goal.executor_name}</span></div>}
            {goal.parent_goal_id && <div className={detailItemClass}><span className={labelClass}>Parent Goal ID:</span><Link href={`/goals/${goal.parent_goal_id}`} className={`${valueClass} text-sky-600 hover:underline`}>{goal.parent_goal_id}</Link></div>}
            {goal.organization_context && <div className={detailItemClass}><span className={labelClass}>Org Context:</span><span className={valueClass}>{goal.organization_context}</span></div>}
        </div>

        <div className="mt-6">
            <h2 className="text-2xl font-semibold text-slate-700 mb-4 border-b pb-2">AI Goal Analysis</h2>
            <button
                type="button"
                onClick={handleGetLlmFeedback}
                disabled={llmLoading || isLoading} /* isLoading here refers to page load */
                className="mb-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
                {llmLoading ? 'Analyzing...' : (goal.llm_feedback ? 'Refresh AI Feedback' : 'Get AI Feedback')}
            </button>
            {goal.llm_feedback && (
            <div className={`${detailItemClass} bg-blue-50 p-4 rounded-md`}>
                <pre className="whitespace-pre-wrap text-sm text-blue-800">{goal.llm_feedback}</pre>
            </div>
            )}
        </div>

        <div className="mt-8 text-center">
            <button
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
            Back to Goals
            </button>
        </div>
      </div>
    </div>
  );
}
