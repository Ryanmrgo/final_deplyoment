import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import CourseDeletionRequest from '@/models/CourseDeletionRequest';
import User from '@/models/User';
import { getEffectiveRole } from '@/lib/auth';
import { createNotification, createNotificationsBulk } from '@/lib/notifications';
import mongoose from 'mongoose';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 401 });
  }

  const { id: courseId } = await params;
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  let teacherMessage = '';
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.message === 'string') {
      teacherMessage = body.message.trim().slice(0, 500);
    }
  } catch {
    teacherMessage = '';
  }

  try {
    await connectDB();

    const course = await Course.findById(courseId).lean();
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (String((course as any).instructor) !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const courseStatus = (course as any).status || 'Draft';
    if (courseStatus === 'Archived') {
      return NextResponse.json({ error: 'This course is already archived' }, { status: 400 });
    }

    const existingPending = await CourseDeletionRequest.findOne({
      courseId,
      status: 'pending',
    }).lean();
    if (existingPending) {
      return NextResponse.json({ error: 'A deletion request is already pending for this course' }, { status: 409 });
    }

    const courseTitle = String((course as any).title || 'Course');

    const requestDoc = await CourseDeletionRequest.create({
      teacherId: userId,
      courseId,
      courseTitle,
      status: 'pending',
      teacherMessage,
    });

    await createNotification({
      recipientId: userId,
      recipientRole: 'teacher',
      type: 'course.deletion_request_submitted',
      title: `Request sent: "${courseTitle}"`,
      message: `You asked an admin to archive "${courseTitle}". You will get another notification when they approve or reject.`,
      entityType: 'courseDeletionRequest',
      entityId: String(requestDoc._id),
      actionUrl: '/notifications',
      priority: 'medium',
      metadata: { courseId, courseTitle, requestId: String(requestDoc._id) },
    });

    const teacher = await User.findById(userId).select('name email').lean();
    const teacherName = (teacher as any)?.name?.trim() || 'A teacher';
    const teacherEmail = String((teacher as any)?.email || '').trim();

    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (admins.length > 0) {
      const who = teacherEmail ? `${teacherName} (${teacherEmail})` : teacherName;
      const adminBody = `${who} asked to archive "${courseTitle}". Review the course page, then open Admin → Course deletion requests to approve or reject.`;
      const adminMessage = adminBody.length > 500 ? `${adminBody.slice(0, 497)}…` : adminBody;
      await createNotificationsBulk(
        admins.map((admin: any) => ({
          recipientId: String(admin._id),
          recipientRole: 'admin' as const,
          type: 'course.deletion_requested' as const,
          title: `Removal request: "${courseTitle}"`,
          message: adminMessage,
          entityType: 'courseDeletionRequest' as const,
          entityId: String(requestDoc._id),
          actionUrl: '/dashboard/admin#course-deletions',
          priority: 'high' as const,
          metadata: {
            courseId,
            courseTitle,
            requestId: String(requestDoc._id),
            teacherId: userId,
            teacherName,
            ...(teacherEmail ? { teacherEmail } : {}),
          },
        }))
      );
    }

    return NextResponse.json({
      success: true,
      request: { id: String(requestDoc._id), status: requestDoc.status },
    });
  } catch (error: unknown) {
    const code = (error as any)?.code;
    if (code === 11000) {
      return NextResponse.json({ error: 'A pending deletion request already exists for this course' }, { status: 409 });
    }
    console.error('Course deletion request error:', error);
    return NextResponse.json({ error: 'Failed to submit deletion request' }, { status: 500 });
  }
}
