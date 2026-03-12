import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Quiz from '@/models/Quiz';
import Enrollment from '@/models/Enrollment';
import { getEffectiveRole } from '@/lib/auth';

export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const enrollmentQuery: Record<string, unknown> = { studentId: userId };
    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 });
      }
      enrollmentQuery.courseId = new mongoose.Types.ObjectId(courseId);
    }

    const enrollments = await Enrollment.find(enrollmentQuery).select('courseId').lean();
    const enrolledCourseIds = enrollments.map((item: any) => item.courseId).filter(Boolean);

    if (!enrolledCourseIds.length) {
      return NextResponse.json({ items: [] });
    }

    const quizzes = await Quiz.find({
      courseId: { $in: enrolledCourseIds },
      isPublished: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    const items = quizzes.map((quiz: any) => ({
      id: String(quiz._id),
      title: String(quiz.title || 'Untitled Quiz'),
      description: String(quiz.description || ''),
      courseId: String(quiz.courseId),
      totalPoints: Number(quiz.totalPoints || 0),
      passingScore: Number(quiz.passingScore || 70),
      timeLimit: Number(quiz.timeLimit || 0),
      attempts: Math.max(1, Number(quiz.attempts || 1)),
      createdAt: quiz.createdAt,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching student quizzes:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}
