import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import CourseDeletionRequest from '@/models/CourseDeletionRequest';
import Enrollment from '@/models/Enrollment';
import { getEffectiveRole } from '@/lib/auth';
import { createNotification, createNotificationsBulk } from '@/lib/notifications';
import mongoose from 'mongoose';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Request ID required' }, { status: 400 });
  }

  let body: { status?: 'approved' | 'rejected'; adminNote?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.status !== 'approved' && body.status !== 'rejected') {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 });
  }

  const adminNote = typeof body.adminNote === 'string' ? body.adminNote.trim().slice(0, 500) : '';

  try {
    await connectDB();

    const requestDoc = await CourseDeletionRequest.findById(id);
    if (!requestDoc) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    if (requestDoc.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 409 });
    }

    const courseIdStr = String(requestDoc.courseId);
    const teacherId = String(requestDoc.teacherId);
    const courseTitle = String(requestDoc.courseTitle || 'Course');

    if (body.status === 'rejected') {
      requestDoc.status = 'rejected';
      requestDoc.adminNote = adminNote;
      requestDoc.reviewedBy = userId;
      requestDoc.reviewedAt = new Date();
      await requestDoc.save();

      const rejectMsg = adminNote
        ? `Course "${courseTitle}": your removal request was rejected. Admin note: ${adminNote}`
        : `Course "${courseTitle}": your removal request was rejected.`;
      await createNotification({
        recipientId: teacherId,
        recipientRole: 'teacher',
        type: 'course.deletion_request_rejected',
        title: `Rejected: "${courseTitle}"`,
        message: rejectMsg.length > 500 ? `${rejectMsg.slice(0, 497)}…` : rejectMsg,
        entityType: 'courseDeletionRequest',
        entityId: String(requestDoc._id),
        actionUrl: '/notifications',
        priority: 'high',
        metadata: { courseId: courseIdStr, courseTitle, requestId: String(requestDoc._id) },
      });

      return NextResponse.json({ success: true, status: requestDoc.status });
    }

    // Approved: archive course and notify students + teacher
    const course = await Course.findById(requestDoc.courseId);
    if (!course) {
      requestDoc.status = 'approved';
      requestDoc.adminNote = adminNote || 'Course record was missing';
      requestDoc.reviewedBy = userId;
      requestDoc.reviewedAt = new Date();
      await requestDoc.save();

      await createNotification({
        recipientId: teacherId,
        recipientRole: 'teacher',
        type: 'course.deletion_request_approved',
        title: `Approved: "${courseTitle}" archived`,
        message: `An admin approved removing "${courseTitle}". The course is archived and no longer visible to students.`,
        entityType: 'courseDeletionRequest',
        entityId: String(requestDoc._id),
        actionUrl: '/dashboard/teacher#my-courses',
        priority: 'high',
        metadata: { courseId: courseIdStr, courseTitle, requestId: String(requestDoc._id) },
      });

      return NextResponse.json({ success: true, status: requestDoc.status, warning: 'Course document was already removed' });
    }

    (course as any).status = 'Archived';
    (course as any).updatedAt = new Date();
    await course.save();

    requestDoc.status = 'approved';
    requestDoc.adminNote = adminNote;
    requestDoc.reviewedBy = userId;
    requestDoc.reviewedAt = new Date();
    await requestDoc.save();

    const enrollments = await Enrollment.find({
      courseId: new mongoose.Types.ObjectId(courseIdStr),
    })
      .select('studentId')
      .lean();

    const studentIds = [...new Set(enrollments.map((e: any) => String(e.studentId)).filter(Boolean))];

    if (studentIds.length > 0) {
      const removedMessage = `The course "${courseTitle}" is no longer available. It was archived after your instructor requested removal and an administrator approved it.`;
      await createNotificationsBulk(
        studentIds.map((sid) => ({
          recipientId: sid,
          recipientRole: 'student' as const,
          type: 'course.removed' as const,
          title: `Removed: "${courseTitle}"`,
          message: removedMessage.length > 500 ? `${removedMessage.slice(0, 497)}…` : removedMessage,
          entityType: 'course' as const,
          entityId: courseIdStr,
          actionUrl: '/courses',
          priority: 'high' as const,
          metadata: { courseId: courseIdStr, courseTitle },
        }))
      );
    }

    await createNotification({
      recipientId: teacherId,
      recipientRole: 'teacher',
      type: 'course.deletion_request_approved',
      title: `Approved: "${courseTitle}" archived`,
      message: `An admin approved removing "${courseTitle}". The course is archived and no longer visible to students.`,
      entityType: 'courseDeletionRequest',
      entityId: String(requestDoc._id),
      actionUrl: '/dashboard/teacher#my-courses',
      priority: 'high',
      metadata: { courseId: courseIdStr, courseTitle, requestId: String(requestDoc._id) },
    });

    return NextResponse.json({ success: true, status: requestDoc.status });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}
