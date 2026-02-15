import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
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

    const courses = await Course.find({ instructor: userId }).lean();
    const courseIds = courses.map((c: any) => c._id);
    const courseMap = Object.fromEntries(courses.map((c: any) => [c._id.toString(), c]));

    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .populate('courseId')
      .sort({ enrolledAt: -1 })
      .limit(20)
      .lean();

    const studentIds = [...new Set(enrollments.map((e: any) => e.studentId))];
    const users = await User.find({ _id: { $in: studentIds } }).lean();
    const userMap = Object.fromEntries(users.map((u: any) => [u._id, u.name]));

    const items = enrollments.map((e: any) => {
      const course = courseMap[e.courseId?._id?.toString() || e.courseId] || e.courseId;
      const courseTitle = course?.title || 'Course';
      const studentName = userMap[e.studentId] || 'Student';
      const initials = studentName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

      return {
        id: e._id,
        type: e.status === 'Completed' ? 'completed' : 'enrolled',
        studentName,
        initials,
        courseTitle,
        message:
          e.status === 'Completed'
            ? `${studentName} completed "${courseTitle}"`
            : `${studentName} enrolled in "${courseTitle}"`,
        time: e.enrolledAt || e.updatedAt,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching teacher activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
