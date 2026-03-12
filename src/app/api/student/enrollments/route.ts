import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Enrollment from '@/models/Enrollment';
import { getEffectiveRole } from '@/lib/auth';

export async function GET() {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  try {
    await connectDB();
    const enrollments = await Enrollment.find({ studentId: userId })
      .populate('courseId')
      .sort({ enrolledAt: -1 });
    return NextResponse.json({ items: enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}
