import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Discussion from '@/models/Discussion';
import { getEffectiveRole } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ discussionId: string }> }
) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  try {
    const { discussionId } = await params;
    if (!mongoose.Types.ObjectId.isValid(discussionId)) {
      return NextResponse.json({ error: 'Invalid discussion ID' }, { status: 400 });
    }

    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const resolved = body.resolved === true;

    if (!message) {
      return NextResponse.json({ error: 'Reply message is required' }, { status: 400 });
    }

    await connectDB();

    const discussion = await Discussion.findById(discussionId).lean();
    if (!discussion) {
      return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });
    }

    const course = await Course.findOne({
      _id: discussion.courseId,
      instructor: userId,
    }).lean();

    if (!course) {
      return NextResponse.json({ error: 'Forbidden: not your course' }, { status: 403 });
    }

    const updated = await Discussion.findByIdAndUpdate(
      discussionId,
      {
        $push: {
          replies: {
            teacherId: userId,
            message,
            createdAt: new Date(),
          },
        },
        $set: {
          resolved,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    await createNotification({
      recipientId: String((discussion as any).studentId),
      recipientRole: 'student',
      type: 'discussion.reply',
      title: 'New reply to your question',
      message: `Your discussion in "${String((course as any).title || 'course')}" received a teacher reply.`,
      entityType: 'discussion',
      entityId: String(discussionId),
      actionUrl: `/courses/${String((discussion as any).courseId)}`,
      priority: 'medium',
      metadata: { discussionId, courseId: String((discussion as any).courseId) },
    });

    return NextResponse.json({ success: true, discussion: updated });
  } catch (error) {
    console.error('Error replying to discussion:', error);
    return NextResponse.json({ error: 'Failed to add reply' }, { status: 500 });
  }
}
