import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Enrollment from '@/models/Enrollment';
import EnrollmentRequest from '@/models/EnrollmentRequest';
import { getEffectiveRole } from '@/lib/auth';

export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  const url = new URL(req.url);
  const courseId = String(url.searchParams.get('courseId') || '').trim();
  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    return NextResponse.json({ error: 'Valid courseId is required' }, { status: 400 });
  }

  try {
    await connectDB();

    const enrollment = await Enrollment.findOne({
      studentId: userId,
      courseId: new mongoose.Types.ObjectId(courseId),
    })
      .select('_id')
      .lean();

    if (enrollment) {
      return NextResponse.json({ status: 'approved', isEnrolled: true });
    }

    const requestDoc = await EnrollmentRequest.findOne({ studentId: userId, courseId })
      .select('status')
      .lean();

    return NextResponse.json({
      status: requestDoc ? (requestDoc as any).status : null,
      isEnrolled: false,
    });
  } catch (error) {
    console.error('Error checking enrollment request status:', error);
    return NextResponse.json({ error: 'Failed to check enrollment status' }, { status: 500 });
  }
}
