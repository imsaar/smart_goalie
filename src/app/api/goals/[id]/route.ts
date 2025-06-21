import { NextResponse } from 'next/server';
import { getGoalById, updateGoal, deleteGoal, GoalInputData } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    const goal = await getGoalById(id);
    if (goal) {
      return NextResponse.json(goal);
    } else {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`API GET /api/goals/${params.id} error:`, error);
    return NextResponse.json({ error: 'Failed to fetch goal' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    const goalData = await request.json() as GoalInputData;
    const success = await updateGoal(id, goalData);
    if (success) {
      // Fetch the updated goal to return it, or just return the input data
      const updatedGoal = await getGoalById(id);
      return NextResponse.json(updatedGoal || { id, ...goalData });
    } else {
      // This might indicate the goal wasn't found or no changes were made
      return NextResponse.json({ error: 'Failed to update goal or goal not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`API PUT /api/goals/${params.id} error:`, error);
    const message = error instanceof Error ? error.message : 'Failed to update goal';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }
    const success = await deleteGoal(id);
    if (success) {
      return NextResponse.json({ message: 'Goal deleted successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Failed to delete goal or goal not found' }, { status: 404 });
    }
  } catch (error) {
    console.error(`API DELETE /api/goals/${params.id} error:`, error);
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 });
  }
}
