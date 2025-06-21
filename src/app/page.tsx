"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import GoalCard from '@/components/GoalCard';

interface Goal {
  id: number;
  title: string;
  description?: string;
  status?: string;
  level?: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'five_year';
  due_date?: string;
  executor_name?: string;
}

export default function HomePage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/goals');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Error: ${response.status}`);
        }
        const data: Goal[] = await response.json();
        setGoals(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch goals.');
        console.error("Error fetching goals:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, []);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-slate-800">SMART Goals</h1>
        <Link href="/goals/new" className="px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md hover:bg-sky-700 transition duration-150 ease-in-out">
          Create New Goal
        </Link>
      </div>

      {isLoading && (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">Loading goals...</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          <p>Error loading goals: {error}</p>
        </div>
      )}

      {!isLoading && !error && goals.length === 0 && (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No goals found. Start by creating one!</p>
        </div>
      )}

      {!isLoading && !error && goals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </main>
  );
}
