import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Progress from '@/models/Progress';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const query: any = { studentId: userId };
    if (courseId) {
      query.courseId = new mongoose.Types.ObjectId(courseId);
    }

    const progress = await Progress.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ items: progress });
  } catch (error) {
    console.error('Error fetching progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  const body = await req.json();

  if (!body?.courseId || !body?.lessonId) {
    return NextResponse.json({ error: 'courseId and lessonId are required' }, { status: 400 });
  }

  try {
    await connectDB();
    const progress = await Progress.findOneAndUpdate(
      {
        studentId: userId,
        courseId: new mongoose.Types.ObjectId(body.courseId),
        lessonId: body.lessonId,
      },
      {
        isCompleted: body.isCompleted ?? true,
        completedAt: body.isCompleted ? new Date() : null,
        timeSpent: body.timeSpent || 0,
        notes: body.notes || '',
        lastViewedAt: new Date(),
      },
      { upsert: true, new: true }
    );
    return NextResponse.json({ success: true, progress });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
  }
}
