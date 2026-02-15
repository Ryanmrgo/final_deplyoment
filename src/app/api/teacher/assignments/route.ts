import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Assignment from '@/models/Assignment';
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

    const assignments = await Assignment.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ items: assignments });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
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
    const assignment = new Assignment({
      title: body.title,
      description: body.description || '',
      courseId: new mongoose.Types.ObjectId(body.courseId),
      instructorId: userId,
      dueDate: body.dueDate || new Date(),
      maxPoints: body.maxPoints || 100,
      instructions: body.instructions || '',
    });
    await assignment.save();
    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
