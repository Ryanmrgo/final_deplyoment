import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Quiz from '@/models/Quiz';
import QuizAttempt from '@/models/QuizAttempt';
import User from '@/models/User';
import { getEffectiveRole } from '@/lib/auth';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid quiz ID' }, { status: 400 });
    }

    await connectDB();
    const quiz = await Quiz.findOne({ _id: id, instructorId: userId }).lean();
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    const attempts = await QuizAttempt.find({ quizId: id })
      .sort({ submittedAt: -1, attemptNumber: -1 })
      .lean();

    const studentIds = [...new Set(attempts.map((item: any) => String(item.studentId)).filter(Boolean))];
    const students = studentIds.length
      ? await User.find({ _id: { $in: studentIds } }).select('_id name email').lean()
      : [];
    const studentMap = Object.fromEntries(
      students.map((user: any) => [String(user._id), { name: user.name || 'Student', email: user.email || '' }])
    );

    const items = attempts.map((item: any) => ({
      id: String(item._id),
      studentId: String(item.studentId),
      studentName: studentMap[String(item.studentId)]?.name || String(item.studentId),
      studentEmail: studentMap[String(item.studentId)]?.email || '',
      attemptNumber: Number(item.attemptNumber || 1),
      score: Number(item.score || 0),
      maxScore: Number(item.maxScore || 0),
      percentage: Number(item.percentage || 0),
      passed: Boolean(item.passed),
      submittedAt: item.submittedAt,
      timeSpent: Number(item.timeSpent || 0),
      teacherRemark: String(item.teacherRemark || ''),
      reviewedAt: item.reviewedAt,
    }));

    return NextResponse.json({
      items,
      quiz: {
        id: String((quiz as any)._id),
        title: String((quiz as any).title || 'Quiz'),
      },
    });
  } catch (error) {
    console.error('Error fetching teacher quiz attempts:', error);
    return NextResponse.json({ error: 'Failed to fetch quiz attempts' }, { status: 500 });
  }
}
