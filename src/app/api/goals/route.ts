import { NextResponse } from 'next/server';
import { addGoal, getAllGoals, GoalInputData } from '@/lib/db';

export async function GET() {
  try {
    const goals = await getAllGoals();
    return NextResponse.json(goals);
  } catch (error) {
    console.error('API GET /api/goals error:', error);
    return NextResponse.json({ error: 'Failed to fetch goals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const goalData = await request.json() as GoalInputData;
    const newGoalId = await addGoal(goalData);
    if (newGoalId) {
      return NextResponse.json({ id: newGoalId, ...goalData }, { status: 201 });
    } else {
      // This case might not be reached if addGoal throws on failure, but as a fallback:
      return NextResponse.json({ error: 'Failed to create goal, no ID returned' }, { status: 500 });
    }
  } catch (error) {
    console.error('API POST /api/goals error:', error);
    // It's good to be more specific with error messages if possible
    const message = error instanceof Error ? error.message : 'Failed to create goal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
