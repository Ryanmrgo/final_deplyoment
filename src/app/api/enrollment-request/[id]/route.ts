import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Enrollment from '@/models/Enrollment';
import EnrollmentRequest from '@/models/EnrollmentRequest';
import Course from '@/models/Course';
import { getEffectiveRole } from '@/lib/auth';

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

  const status = body.status;
  if (status !== 'approved' && status !== 'rejected') {
    return NextResponse.json({ error: 'status must be "approved" or "rejected"' }, { status: 400 });
  }

  try {
    await connectDB();
    const requestDoc = await EnrollmentRequest.findById(id);
    if (!requestDoc) {
      return NextResponse.json({ error: 'Enrollment request not found' }, { status: 404 });
    }

    requestDoc.status = status;
    await requestDoc.save();

    if (status === 'approved') {
      const existingEnrollment = await Enrollment.findOne({
        studentId: requestDoc.studentId,
        courseId: requestDoc.courseId,
      }).lean();

      if (!existingEnrollment) {
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
    }

    return NextResponse.json({ success: true, status: requestDoc.status });
  } catch (error) {
    console.error('Error updating enrollment request:', error);
    return NextResponse.json({ error: 'Failed to update enrollment request' }, { status: 500 });
  }
}
