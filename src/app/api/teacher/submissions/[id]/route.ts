import connectDB from '@/config/db';
import { getEffectiveRole } from '@/lib/auth';
import Submission from '@/models/Submission';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { points, feedback } = body;

  if (points === undefined || points === null) {
    return NextResponse.json({ error: 'points are required' }, { status: 400 });
  }

  await connectDB();
  const submission = await Submission.findById(id).populate('assignmentId');
  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  const assignment = submission.assignmentId as any;
  if (assignment.instructorId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const maxPoints = assignment.maxPoints || 100;
  const pointsNum = Math.min(Math.max(0, Number(points)), maxPoints);
  const percentage = (pointsNum / maxPoints) * 100;

  submission.grade = {
    points: pointsNum,
    maxPoints,
    percentage,
    feedback: feedback || '',
    gradedAt: new Date(),
    gradedBy: userId,
  };
  submission.status = 'Graded';
  await submission.save();

  return NextResponse.json({ success: true, submission });
}