"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  name: string;
}

interface Goal {
  id?: number;
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

interface GoalFormProps {
  initialGoal?: Goal;
  onSave: (goal: Goal) => Promise<void>;
  isEditing?: boolean;
}

const NEW_USER_OPTION_VALUE = "__NEW_USER__";

export default function GoalForm({ initialGoal, onSave, isEditing = false }: GoalFormProps) {
  const [goal, setGoal] = useState<Goal>(
    initialGoal || {
      title: '',
      description: '',
      specific: '',
      motivating: '',
      attainable: '',
      relevant: '',
      trackable_metrics: '',
      level: 'monthly',
      due_date: '',
      status: 'pending',
      executor_name: null,
    }
  );
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedExecutorValue, setSelectedExecutorValue] = useState<string>(''); // Stores dropdown value (name or NEW_USER_OPTION_VALUE)
  const [newExecutorNameInput, setNewExecutorNameInput] = useState<string>(''); // For the new user name text input

  const [isLoading, setIsLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data: User[] = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        // setError("Could not load users list."); // Optionally inform user
      }
    };
    fetchUsers();
  }, []);

  // Effect to handle initialGoal and pre-fill executor selection
  useEffect(() => {
    if (initialGoal) {
      setGoal(initialGoal);
      if (initialGoal.executor_name) {
        // Check if the executor_name from initialGoal exists in the fetched users list
        const existingUser = users.find(u => u.name === initialGoal.executor_name);
        if (existingUser) {
          setSelectedExecutorValue(initialGoal.executor_name);
          setNewExecutorNameInput(''); // Clear new name input
        } else {
          // If not in the list, assume it's a new/custom name or was previously entered as such
          setSelectedExecutorValue(NEW_USER_OPTION_VALUE);
          setNewExecutorNameInput(initialGoal.executor_name);
        }
      } else {
        setSelectedExecutorValue(''); // No executor initially
        setNewExecutorNameInput('');
      }
    }
  }, [initialGoal, users]); // Rerun if users list changes after initialGoal is set


  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGoal((prevGoal) => ({ ...prevGoal, [name]: value }));
  };

  const handleExecutorChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    setSelectedExecutorValue(selectedValue);

    if (selectedValue === NEW_USER_OPTION_VALUE) {
      // If "Create New" is selected, we'll use the newExecutorNameInput for goal.executor_name
      // but we wait for that input to be filled. Clear any existing goal.executor_name for now.
      setGoal(prev => ({ ...prev, executor_name: newExecutorNameInput || null }));
    } else if (selectedValue === "") { // "Select Executor" or empty option
        setGoal(prev => ({ ...prev, executor_name: null }));
        setNewExecutorNameInput(''); // Clear custom name input
    } else {
      // Existing user selected
      setGoal(prev => ({ ...prev, executor_name: selectedValue }));
      setNewExecutorNameInput(''); // Clear custom name input
    }
  };
  
  const handleNewExecutorNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setNewExecutorNameInput(newName);
    // If "Create New" is still selected in dropdown, update goal.executor_name directly
    if (selectedExecutorValue === NEW_USER_OPTION_VALUE) {
      setGoal(prev => ({ ...prev, executor_name: newName || null }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!goal.title) {
      setError("Title is required.");
      return;
    }
    
    let finalGoalData = { ...goal };
    // Ensure executor_name is correctly set based on final state of dropdown and input
    if (selectedExecutorValue === NEW_USER_OPTION_VALUE) {
      finalGoalData.executor_name = newExecutorNameInput.trim() || null;
    } else if (selectedExecutorValue === "") {
      finalGoalData.executor_name = null;
    } else {
      finalGoalData.executor_name = selectedExecutorValue;
    }
    
    // Validate that if "Create New User" was selected, a name was actually provided
    if (selectedExecutorValue === NEW_USER_OPTION_VALUE && !finalGoalData.executor_name) {
        setError("Please enter a name for the new executor or select an existing one.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onSave(finalGoalData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save goal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLlmFeedback = async () => {
    // ... (LLM feedback logic remains the same)
    if (!goal.title) {
      setError("Please provide at least a title for LLM analysis.");
      return;
    }
    setLlmLoading(true);
    setError(null);
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
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Error ${response.status}`);
      }
      const data = await response.json();
      setGoal(prev => ({ ...prev, llm_feedback: data.feedback }));
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get LLM feedback.';
        setError(errorMessage);
        setGoal(prev => ({ ...prev, llm_feedback: `Error: ${errorMessage}` }));
    } finally {
      setLlmLoading(false);
    }
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none invalid:border-pink-500 invalid:text-pink-600 focus:invalid:border-pink-500 focus:invalid:ring-pink-500";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 bg-slate-50 rounded-lg shadow">
      {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}

      <div>
        <label htmlFor="title" className={labelClass}>Goal Title <span className="text-red-500">*</span></label>
        <input type="text" name="title" id="title" value={goal.title} onChange={handleInputChange} className={inputClass} required />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description</label>
        <textarea name="description" id="description" value={goal.description || ''} onChange={handleInputChange} rows={3} className={inputClass}></textarea>
      </div>

      <fieldset className="p-4 border border-slate-300 rounded-md">
        <legend className="text-lg font-semibold text-slate-800 px-2">SMART Details</legend>
        <div className="space-y-4 mt-2">
            <div>
                <label htmlFor="specific" className={labelClass}>S - Specific</label>
                <textarea name="specific" id="specific" value={goal.specific || ''} onChange={handleInputChange} rows={2} className={inputClass}></textarea>
            </div>
            <div>
                <label htmlFor="motivating" className={labelClass}>M - Motivating</label>
                <textarea name="motivating" id="motivating" value={goal.motivating || ''} onChange={handleInputChange} rows={2} className={inputClass}></textarea>
            </div>
            <div>
                <label htmlFor="attainable" className={labelClass}>A - Attainable</label>
                <textarea name="attainable" id="attainable" value={goal.attainable || ''} onChange={handleInputChange} rows={2} className={inputClass}></textarea>
            </div>
            <div>
                <label htmlFor="relevant" className={labelClass}>R - Relevant</label>
                <textarea name="relevant" id="relevant" value={goal.relevant || ''} onChange={handleInputChange} rows={2} className={inputClass}></textarea>
            </div>
            <div>
                <label htmlFor="trackable_metrics" className={labelClass}>T - Trackable Metrics</label>
                <textarea name="trackable_metrics" id="trackable_metrics" value={goal.trackable_metrics || ''} onChange={handleInputChange} rows={2} className={inputClass}></textarea>
            </div>
        </div>
      </fieldset>
      
      {/* Executor Dropdown and Conditional Input */}
      <div>
        <label htmlFor="owner_select" className={labelClass}>Owner</label>
        <select
          id="owner_select"
          name="owner_select" /* Technically this name attribute isn't directly used for state, but good to keep it semantic */
          value={selectedExecutorValue}
          onChange={handleExecutorChange}
          className={inputClass}
        >
          <option value="">-- Select Owner --</option>
          {users.map(user => (
            <option key={user.id} value={user.name}>{user.name}</option>
          ))}
          <option value={NEW_USER_OPTION_VALUE}>--- Create New User ---</option>
        </select>

        {selectedExecutorValue === NEW_USER_OPTION_VALUE && (
          <div className="mt-2">
            <label htmlFor="new_executor_name" className={`${labelClass} text-sm`}>New Owner Name:</label>
            <input
              type="text"
              id="new_executor_name"
              name="new_executor_name"
              value={newExecutorNameInput}
              onChange={handleNewExecutorNameChange}
              className={`${inputClass} mt-1`}
              placeholder="Enter full name of new owner"
            />
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="level" className={labelClass}>Goal Level</label>
          <select name="level" id="level" value={goal.level || 'monthly'} onChange={handleInputChange} className={inputClass}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="five_year">Five Year</option>
          </select>
        </div>
        <div>
          <label htmlFor="due_date" className={labelClass}>Due Date</label>
          <input type="date" name="due_date" id="due_date" value={goal.due_date || ''} onChange={handleInputChange} className={inputClass} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label htmlFor="parent_goal_id" className={labelClass}>Parent Goal ID (Optional)</label>
            <input type="number" name="parent_goal_id" id="parent_goal_id" value={goal.parent_goal_id || ''} onChange={handleInputChange} className={inputClass} placeholder="ID of parent goal"/>
        </div>
         <div>
            <label htmlFor="organization_context" className={labelClass}>Organizational Context/Tags</label>
            <input type="text" name="organization_context" id="organization_context" value={goal.organization_context || ''} onChange={handleInputChange} className={inputClass} placeholder="e.g., Marketing Q3, R&D" />
        </div>
      </div>

      <div>
            <button
            type="button"
            onClick={handleGetLlmFeedback}
            disabled={llmLoading || isLoading}
            className="mt-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
            {llmLoading ? 'Analyzing...' : 'Get LLM Feedback'}
            </button>
            {goal.llm_feedback && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-semibold text-blue-800">LLM Feedback:</h4>
                <pre className="whitespace-pre-wrap text-sm text-blue-700">{goal.llm_feedback}</pre>
            </div>
            )}
        </div>

      <div className="flex justify-end space-x-3">
        <button
            type="button"
            onClick={() => router.back()}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || llmLoading}
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50"
        >
          {isLoading ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Create Goal')}
        </button>
      </div>
    </form>
  );
}
