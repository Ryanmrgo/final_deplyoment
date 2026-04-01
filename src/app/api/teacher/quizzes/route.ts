import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Quiz from '@/models/Quiz';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import mongoose from 'mongoose';
import { getEffectiveRole } from '@/lib/auth';
import { createNotificationsBulk } from '@/lib/notifications';

export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const query: any = { instructorId: userId };
    if (courseId) {
      query.courseId = new mongoose.Types.ObjectId(courseId);
    }

    const quizzes = await Quiz.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ items: quizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  const body = await req.json();

  if (!body?.title || !body?.courseId) {
    return NextResponse.json({ error: 'title and courseId are required' }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(body.courseId)) {
    return NextResponse.json({ error: 'Invalid courseId' }, { status: 400 });
  }

  try {
    await connectDB();

    // Ensure quiz is attached only to an existing course owned by the current teacher.
    const course = await Course.findOne({
      _id: new mongoose.Types.ObjectId(body.courseId),
      instructor: userId,
    }).lean();

    if (!course) {
      return NextResponse.json({ error: 'Course not found or not owned by teacher' }, { status: 404 });
    }

    const quiz = new Quiz({
      title: body.title,
      description: body.description || '',
      courseId: course._id,
      instructorId: userId,
      questions: body.questions || [],
      totalPoints: body.totalPoints || 0,
      passingScore: body.passingScore || 70,
      timeLimit: body.timeLimit || 0,
      attempts: body.attempts || 1,
      isPublished: Boolean(body.isPublished),
    });
    await quiz.save();

    if (quiz.isPublished) {
      const enrolled = await Enrollment.find({ courseId: course._id }).select('studentId').lean();
      if (enrolled.length > 0) {
        await createNotificationsBulk(
          enrolled.map((item: any) => ({
            recipientId: String(item.studentId),
            recipientRole: 'student' as const,
            type: 'quiz.published' as const,
            title: 'New quiz published',
            message: `A new quiz "${String(quiz.title || 'quiz')}" is available in your course.`,
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
    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
