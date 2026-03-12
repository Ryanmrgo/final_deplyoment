import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import User from '@/models/User';
import { getEffectiveRole } from '@/lib/auth';

export async function GET() {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    await connectDB();

    const courses = await Course.find({ 'reviews.0': { $exists: true } })
      .select('_id title reviews')
      .sort({ createdAt: -1 })
      .lean();

    const rows = courses.flatMap((course: any) =>
      (course.reviews || []).map((review: any) => ({
        id: `${course._id}-${review.studentId}`,
        courseId: String(course._id),
        courseTitle: String(course.title || 'Course'),
        studentId: String(review.studentId || ''),
        rating: Number(review.rating) || 0,
        comment: String(review.comment || ''),
        createdAt: review.createdAt || null,
      }))
    );

    const studentIds = [...new Set(rows.map((r) => r.studentId).filter(Boolean))];
    const users = studentIds.length
      ? await User.find({ _id: { $in: studentIds } }).select('_id name').lean()
      : [];
    const userMap = Object.fromEntries(users.map((u: any) => [String(u._id), String(u.name || 'Student')]));

    return NextResponse.json({
      items: rows
        .map((row) => ({ ...row, studentName: userMap[row.studentId] || 'Student' }))
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
