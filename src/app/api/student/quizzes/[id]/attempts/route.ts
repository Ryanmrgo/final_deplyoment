import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Quiz from '@/models/Quiz';
import QuizAttempt from '@/models/QuizAttempt';
import Enrollment from '@/models/Enrollment';
import { getEffectiveRole } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'student') return NextResponse.json({ error: 'Student required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    await connectDB();
    const quiz = await Quiz.findById(id).lean();
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    const enrollment = await Enrollment.findOne({
      studentId: userId,
      courseId: (quiz as any).courseId,
    }).lean();
    if (!enrollment) return NextResponse.json({ error: 'Enroll in course first' }, { status: 403 });

    const maxAttempts = Math.max(1, Number((quiz as any).attempts ?? 1));
    const attempts = await QuizAttempt.find({ quizId: id, studentId: userId })
      .sort({ attemptNumber: -1, submittedAt: -1 })
      .lean();

    const items = attempts.map((attempt: any) => ({
      id: String(attempt._id),
      attemptNumber: Number(attempt.attemptNumber || 1),
      score: Number(attempt.score || 0),
      maxScore: Number(attempt.maxScore || 0),
      percentage: Number(attempt.percentage || 0),
      passed: Boolean(attempt.passed),
      submittedAt: attempt.submittedAt,
      timeSpent: Number(attempt.timeSpent || 0),
      teacherRemark: String(attempt.teacherRemark || ''),
      reviewedAt: attempt.reviewedAt || null,
    }));

    const usedAttempts = items.length;
    return NextResponse.json({
      items,
      summary: {
        maxAttempts,
        usedAttempts,
        remainingAttempts: Math.max(0, maxAttempts - usedAttempts),
      },
    });
  } catch (error) {
    console.error('Error fetching quiz attempts:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
}
