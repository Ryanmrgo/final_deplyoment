import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Quiz from '@/models/Quiz';
import QuizAttempt from '@/models/QuizAttempt';
import { getEffectiveRole } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });

  try {
    const { attemptId } = await params;
    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return NextResponse.json({ error: 'Invalid attempt ID' }, { status: 400 });
    }

    const body = await req.json();
    const teacherRemark = String(body.teacherRemark || '').trim();

    await connectDB();
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });

    const quiz = await Quiz.findOne({ _id: attempt.quizId, instructorId: userId }).lean();
    if (!quiz) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    attempt.teacherRemark = teacherRemark;
    attempt.reviewedAt = new Date();
    attempt.reviewedBy = userId;
    await attempt.save();

    return NextResponse.json({
      success: true,
      item: {
        id: String(attempt._id),
        teacherRemark: attempt.teacherRemark || '',
        reviewedAt: attempt.reviewedAt,
      },
    });
  } catch (error) {
    console.error('Error saving teacher quiz remark:', error);
    return NextResponse.json({ error: 'Failed to save quiz remark' }, { status: 500 });
  }
}
