import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import EnrollmentRequest from '@/models/EnrollmentRequest';
import { getEffectiveRole } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';
import { courseSeatEnrollmentAndClauses, getCourseMaxEnrollments } from '@/lib/enrollmentCap';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Request ID is required' }, { status: 400 });
  }

  let body: { status?: 'approved' | 'rejected' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (body.status !== 'approved' && body.status !== 'rejected') {
    return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 });
  }

  try {
    await connectDB();

    const requestDoc = await EnrollmentRequest.findById(id);
    if (!requestDoc) {
      return NextResponse.json({ error: 'Enrollment request not found' }, { status: 404 });
    }

    let existingEnrollment = null;
    if (body.status === 'approved') {
      existingEnrollment = await Enrollment.findOne({
        studentId: requestDoc.studentId,
        courseId: requestDoc.courseId,
      }).lean();

      if (!existingEnrollment) {
        const courseDoc = await Course.findById(requestDoc.courseId).lean();
        if (!courseDoc) {
          return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }
        const maxEnrollments = getCourseMaxEnrollments(courseDoc as any);
        const activeCount = await Enrollment.countDocuments({
          $and: courseSeatEnrollmentAndClauses(String(requestDoc.courseId)),
        });
        if (activeCount >= maxEnrollments) {
          return NextResponse.json(
            {
              error: `Course is full (${activeCount}/${maxEnrollments}). Raise the enrollment cap or free a seat before approving.`,
            },
            { status: 409 }
          );
        }
      }
    }

    requestDoc.status = body.status;
    await requestDoc.save();

    if (body.status === 'approved' && !existingEnrollment) {
      await Enrollment.create({
        studentId: requestDoc.studentId,
        courseId: requestDoc.courseId,
        enrolledAt: new Date(),
        status: 'Active',
      });

      await Course.findByIdAndUpdate(requestDoc.courseId, {
        $addToSet: { students: requestDoc.studentId },
        $inc: { totalStudents: 1 },
      });
    }

    await createNotification({
      recipientId: String(requestDoc.studentId),
      recipientRole: 'student',
      type: body.status === 'approved' ? 'enrollment.approved' : 'enrollment.rejected',
      title: body.status === 'approved' ? 'Enrollment approved' : 'Enrollment request rejected',
      message:
        body.status === 'approved'
          ? 'Your enrollment request was approved. You can start learning now.'
          : 'Your enrollment request was rejected by the admin.',
      entityType: 'enrollmentRequest',
      entityId: String(requestDoc._id),
      actionUrl: `/courses/${String(requestDoc.courseId)}`,
      priority: body.status === 'approved' ? 'high' : 'medium',
      metadata: { courseId: String(requestDoc.courseId) },
    });

    return NextResponse.json({ success: true, status: requestDoc.status });
  } catch (error) {
    console.error('Error updating admin enrollment request status:', error);
    return NextResponse.json({ error: 'Failed to update enrollment request' }, { status: 500 });
  }
}
