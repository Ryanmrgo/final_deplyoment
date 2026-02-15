import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Enrollment from '@/models/Enrollment';

export async function GET() {
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
    const enrollments = await Enrollment.find({ studentId: userId })
      .populate('courseId')
      .sort({ enrolledAt: -1 });
    return NextResponse.json({ items: enrollments });
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 });
  }
}
