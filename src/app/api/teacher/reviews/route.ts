import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import User from '@/models/User';
import { getEffectiveRole } from '@/lib/auth';

export async function GET() {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  try {
    await connectDB();

    const courses = await Course.find({ instructor: userId })
      .select('_id title reviews')
      .sort({ createdAt: -1 })
      .lean();

    const reviewRows = courses.flatMap((course: any) =>
      (course.reviews || []).map((review: any) => ({
        id: review._id?.toString?.() || `${course._id}-${review.studentId}`,
        studentId: review.studentId,
        rating: Number(review.rating) || 0,
        comment: String(review.comment || ''),
        date: review.createdAt || course.createdAt,
        courseTitle: String(course.title || 'Course'),
      }))
    );

    const studentIds = [...new Set(reviewRows.map((row) => row.studentId).filter(Boolean))];
    const users = await User.find({ _id: { $in: studentIds } }).select('_id name').lean();
    const userMap = new Map(users.map((user: any) => [String(user._id), String(user.name || 'Student')]));

    const items = reviewRows
      .map((row) => ({
        ...row,
        student: userMap.get(row.studentId) || 'Student',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching teacher reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
