import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Discussion from '@/models/Discussion';
import Course from '@/models/Course';
import User from '@/models/User';
import { getEffectiveRole } from '@/lib/auth';

export async function GET() {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    await connectDB();

    const discussions = await Discussion.find().sort({ createdAt: -1 }).lean();
    const courseIds = [...new Set(discussions.map((d: any) => String(d.courseId)).filter(Boolean))];
    const studentIds = [...new Set(discussions.map((d: any) => String(d.studentId)).filter(Boolean))];

    const [courses, students] = await Promise.all([
      courseIds.length ? Course.find({ _id: { $in: courseIds } }).select('_id title').lean() : [],
      studentIds.length ? User.find({ _id: { $in: studentIds } }).select('_id name').lean() : [],
    ]);

    const courseMap = Object.fromEntries(courses.map((c: any) => [String(c._id), String(c.title || 'Course')]));
    const studentMap = Object.fromEntries(students.map((s: any) => [String(s._id), String(s.name || 'Student')]));

    const items = discussions.map((d: any) => ({
      id: String(d._id),
      courseId: String(d.courseId),
      courseTitle: courseMap[String(d.courseId)] || 'Course',
      studentId: String(d.studentId),
      studentName: studentMap[String(d.studentId)] || 'Student',
      question: String(d.question || ''),
      resolved: Boolean(d.resolved),
      repliesCount: Array.isArray(d.replies) ? d.replies.length : 0,
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching admin discussions:', error);
    return NextResponse.json({ error: 'Failed to fetch discussions' }, { status: 500 });
  }
}
