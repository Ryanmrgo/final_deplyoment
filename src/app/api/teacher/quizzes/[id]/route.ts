import connectDB from '@/config/db';
import { getEffectiveRole } from '@/lib/auth';
import { createNotificationsBulk } from '@/lib/notifications';
import Enrollment from '@/models/Enrollment';
import Quiz from '@/models/Quiz';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 });
    }

    await connectDB();
    const quiz = await Quiz.findOne({ _id: id, instructorId: userId });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 });
    }

    const body = await req.json();

    await connectDB();
    const quiz = await Quiz.findOne({ _id: id, instructorId: userId });
    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    const wasPublished = quiz.isPublished;

    if (body.title !== undefined) quiz.title = String(body.title || '');
    if (body.description !== undefined) quiz.description = String(body.description || '');
    if (body.questions !== undefined) quiz.questions = Array.isArray(body.questions) ? body.questions : [];
    if (body.totalPoints !== undefined) quiz.totalPoints = Number(body.totalPoints) || 0;
    if (body.passingScore !== undefined) quiz.passingScore = Number(body.passingScore) || 0;
    if (body.timeLimit !== undefined) quiz.timeLimit = Number(body.timeLimit) || 0;
    if (body.attempts !== undefined) quiz.attempts = Math.max(1, Number(body.attempts) || 1);
    if (body.isPublished !== undefined) quiz.isPublished = Boolean(body.isPublished);
    if (body.showAnswersAfterSubmit !== undefined) {
      quiz.showAnswersAfterSubmit = Boolean(body.showAnswersAfterSubmit);
    }
    quiz.updatedAt = new Date();

    await quiz.save();

    if (!wasPublished && quiz.isPublished) {
      const enrolled = await Enrollment.find({ courseId: quiz.courseId }).select('studentId').lean();
      if (enrolled.length > 0) {
        await createNotificationsBulk(
          enrolled.map((item: any) => ({
            recipientId: String(item.studentId),
            recipientRole: 'student' as const,
            type: 'quiz.published' as const,
            title: 'Quiz is now available',
            message: `Quiz "${String(quiz.title || 'quiz')}" has been published.`,
            entityType: 'quiz' as const,
            entityId: String(quiz._id),
            actionUrl: `/courses/${String(quiz.courseId)}`,
            priority: 'medium' as const,
            metadata: { courseId: String(quiz.courseId), quizId: String(quiz._id) },
          }))
        );
      }
    }

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json({ error: 'Failed to update quiz' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 });
  }

  await connectDB();
  const quiz = await Quiz.findOne({ _id: id, instructorId: userId });
  if (!quiz) {
    return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
  }

  await quiz.deleteOne();
  return NextResponse.json({ success: true });
}
