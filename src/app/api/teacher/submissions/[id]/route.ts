import connectDB from '@/config/db';
import { getEffectiveRole } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
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

  const assignTitle = String(assignment.title || 'assignment');
  const feedbackTrim = String(feedback || '').trim();
  const feedbackPart = feedbackTrim
    ? ` Feedback: ${feedbackTrim.length > 180 ? `${feedbackTrim.slice(0, 177)}…` : feedbackTrim}`
    : '';
  let gradeMessage = `You earned ${pointsNum} / ${maxPoints} on "${assignTitle}".${feedbackPart}`;
  if (gradeMessage.length > 500) {
    gradeMessage = `${gradeMessage.slice(0, 497)}…`;
  }
  const gradeTitle =
    `Graded: ${pointsNum}/${maxPoints} — ${assignTitle.length > 60 ? `${assignTitle.slice(0, 57)}…` : assignTitle}`;

  await createNotification({
    recipientId: String(submission.studentId),
    recipientRole: 'student',
    type: 'assignment.graded',
    title: gradeTitle.length > 120 ? gradeTitle.slice(0, 117) + '…' : gradeTitle,
    message: gradeMessage,
    entityType: 'assignment',
    entityId: String(assignment._id),
    actionUrl: `/courses/${String(submission.courseId)}`,
    priority: 'high',
    metadata: {
      assignmentId: String(assignment._id),
      courseId: String(submission.courseId),
      submissionId: String(submission._id),
      points: pointsNum,
      maxPoints,
    },
  });

  return NextResponse.json({ success: true, submission });
}