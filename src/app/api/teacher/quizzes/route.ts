import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Quiz from '@/models/Quiz';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

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
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  const body = await req.json();

  if (!body?.title || !body?.courseId) {
    return NextResponse.json({ error: 'title and courseId are required' }, { status: 400 });
  }

  try {
    await connectDB();
    const quiz = new Quiz({
      title: body.title,
      description: body.description || '',
      courseId: new mongoose.Types.ObjectId(body.courseId),
      instructorId: userId,
      questions: body.questions || [],
      totalPoints: body.totalPoints || 0,
      passingScore: body.passingScore || 70,
      timeLimit: body.timeLimit || 0,
    });
    await quiz.save();
    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
  }
}
