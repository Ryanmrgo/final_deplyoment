import mongoose from 'mongoose';
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Discussion from '@/models/Discussion';
import Enrollment from '@/models/Enrollment';

const ensureCourseAccess = async (courseId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return { error: NextResponse.json({ error: 'Invalid course ID' }, { status: 400 }) };
  }

  const course = await Course.findById(courseId).lean();
  if (!course) {
    return { error: NextResponse.json({ error: 'Course not found' }, { status: 404 }) };
  }

  const isInstructor = String((course as any).instructor || '') === userId;
  const enrollment = await Enrollment.findOne({ courseId: new mongoose.Types.ObjectId(courseId), studentId: userId }).lean();

  if (!isInstructor && !enrollment) {
    return { error: NextResponse.json({ error: 'Access denied' }, { status: 403 }) };
  }

  return { course, isInstructor };
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { id } = await params;

    const access = await ensureCourseAccess(id, userId);
    if (access.error) return access.error;

    const discussions = await Discussion.find({ courseId: id }).sort({ createdAt: -1 }).lean();
    const items = discussions.map((discussion: any) => ({
      ...discussion,
      question: discussion.question || discussion.content || '',
      replies: (discussion.replies || []).map((reply: any) => ({
        ...reply,
        message: reply.message || reply.content || '',
      })),
    }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching discussions:', error);
    return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const question = typeof body.question === 'string'
      ? body.question.trim()
      : typeof body.content === 'string'
        ? body.content.trim()
        : '';
    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    await connectDB();
    const { id } = await params;

    const access = await ensureCourseAccess(id, userId);
    if (access.error) return access.error;

    if (access.isInstructor) {
      return NextResponse.json({ error: 'Teachers should reply through teacher discussion API' }, { status: 400 });
    }

    const discussion = await Discussion.create({
      courseId: new mongoose.Types.ObjectId(id),
      studentId: userId,
      question,
      resolved: false,
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, discussion }, { status: 201 });
  } catch (error) {
    console.error('Error creating discussion:', error);
    return NextResponse.json({ error: 'Failed to create discussion' }, { status: 500 });
  }
}
