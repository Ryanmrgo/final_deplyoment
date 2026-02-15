import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Submission from '@/models/Submission';
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
    const assignmentId = searchParams.get('assignmentId');

    const query: any = { studentId: userId };
    if (assignmentId) {
      query.assignmentId = new mongoose.Types.ObjectId(assignmentId);
    }

    const submissions = await Submission.find(query).sort({ submittedAt: -1 });
    return NextResponse.json({ items: submissions });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  const body = await req.json();

  if (!body?.assignmentId) {
    return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });
  }

  try {
    await connectDB();
    const submission = new Submission({
      studentId: userId,
      assignmentId: new mongoose.Types.ObjectId(body.assignmentId),
      courseId: new mongoose.Types.ObjectId(body.courseId),
      content: body.content || '',
      attachments: body.attachments || [],
      submittedAt: new Date(),
    });
    await submission.save();
    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error('Error creating submission:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
