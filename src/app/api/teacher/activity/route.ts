import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import User from '@/models/User';
import Discussion from '@/models/Discussion';
import { getEffectiveRole } from '@/lib/auth';

type ActivityItem = {
  id: string;
  type: 'enrolled' | 'completed' | 'review' | 'discussion';
  studentName: string;
  initials: string;
  courseTitle: string;
  courseId: string;
  message: string;
  time: Date;
  studentId?: string;
};

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

    // Enrollments (enrolled/completed)
    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } })
      .sort({ enrolledAt: -1 })
      .limit(30)
      .lean();

    const enrollmentStudentIds = enrollments.map((e: any) => e.studentId);

    // Reviews are stored on Course.reviews[]
    const reviewEvents: ActivityItem[] = [];
    for (const c of courses) {
      const reviews = Array.isArray((c as any).reviews) ? (c as any).reviews : [];
      for (const r of reviews) {
        if (!r || !r.studentId) continue;
        reviewEvents.push({
          id: String(r._id || `${c._id}-${r.studentId}-${r.createdAt || ''}`),
          type: 'review',
          studentName: '', // filled later
          initials: '',
          courseTitle: c.title || 'Course',
          message: '', // filled later
          time: r.createdAt || c.updatedAt || new Date(),
          courseId: c._id.toString(),
          studentId: String(r.studentId),
        });
      }
    }

    // Discussions created by students on teacher's courses
    const discussions = await Discussion.find({ courseId: { $in: courseIds } })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const discussionStudentIds = discussions.map((d: any) => d.studentId);

    const allStudentIds = Array.from(
      new Set([...enrollmentStudentIds, ...reviewEvents.map((r) => (r as any).studentId).filter(Boolean), ...discussionStudentIds])
    );

    const users = await User.find({ _id: { $in: allStudentIds } }).lean();
    const userMap = Object.fromEntries(users.map((u: any) => [u._id.toString(), u.name || 'Student']));

    const enrollmentEvents: ActivityItem[] = enrollments.map((e: any) => {
      const rawCourseId = e.courseId?.toString();
      const course = courseMap[rawCourseId] || e.courseId;
      const courseTitle = course?.title || 'Course';
      const studentName = userMap[e.studentId?.toString()] || 'Student';
      const initials = studentName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

      const type: ActivityItem['type'] = e.status === 'Completed' ? 'completed' : 'enrolled';

      return {
        id: e._id.toString(),
        type,
        studentName,
        initials,
        courseTitle,
        courseId: rawCourseId || '',
        message:
          type === 'completed'
            ? `${studentName} completed "${courseTitle}"`
            : `${studentName} enrolled in "${courseTitle}"`,
        time: e.enrolledAt || e.updatedAt || new Date(),
      };
    });

    const hydratedReviews: ActivityItem[] = reviewEvents.map((r) => {
      const studentName = userMap[r.studentId || ''] || 'Student';
      const initials = studentName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const msg = `${studentName} reviewed "${r.courseTitle}"`;
      return {
        ...r,
        type: 'review',
        studentName,
        initials,
        message: msg,
      };
    });

    const discussionEvents: ActivityItem[] = discussions.map((d: any) => {
      const rawCourseId = d.courseId?.toString();
      const course = courseMap[rawCourseId] || d.courseId;
      const courseTitle = course?.title || 'Course';
      const studentName = userMap[d.studentId?.toString()] || 'Student';
      const initials = studentName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const message = `${studentName} asked a question in "${courseTitle}"`;
      return {
        id: d._id.toString(),
        type: 'discussion',
        studentName,
        initials,
        courseTitle,
        courseId: rawCourseId || '',
        message,
        time: d.createdAt || d.updatedAt || new Date(),
      };
    });

    const allEvents = [...enrollmentEvents, ...hydratedReviews, ...discussionEvents].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );

    return NextResponse.json({ items: allEvents.slice(0, 30) });
  } catch (error) {
    console.error('Error fetching teacher activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
