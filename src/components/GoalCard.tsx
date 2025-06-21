"use client";

import Link from 'next/link';

interface Goal {
  id: number;
  title: string;
  description?: string;
  status?: string;
  level?: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'five_year';
  due_date?: string;
  // Add other relevant fields as needed
  executor_name?: string;
}

interface GoalCardProps {
  goal: Goal;
}

export default function GoalCard({ goal }: GoalCardProps) {
  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'in_progress': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'on_hold': return 'bg-orange-100 text-orange-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <h3 className="text-xl font-semibold text-sky-700 mb-2">{goal.title}</h3>
        {goal.status && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(goal.status)}`}>
            {goal.status.replace('_', ' ').toUpperCase()}
          </span>
        )}
      </div>
      {goal.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">{goal.description}</p>}
      
      <div className="text-sm text-gray-500 mb-3">
        {goal.level && <p>Level: <span className="font-medium text-gray-700">{goal.level.charAt(0).toUpperCase() + goal.level.slice(1)}</span></p>}
        {goal.due_date && <p>Due: <span className="font-medium text-gray-700">{new Date(goal.due_date).toLocaleDateString()}</span></p>}
        {goal.executor_name && <p>Owner: <span className="font-medium text-gray-700">{goal.executor_name}</span></p>}
      </div>

      {/* Add more details or actions here */}
      <div className="mt-4 flex justify-end">
        {/* Placeholder for Edit/View Details link. Need to create [id]/page.tsx and [id]/edit/page.tsx */}
        <Link href={`/goals/${goal.id}/edit`} className="text-sm text-sky-600 hover:text-sky-800 font-medium mr-4">
          Edit
        </Link>
        <Link href={`/goals/${goal.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
           View Details
        </Link>
      </div>
    </div>
  );
}
