import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import Progress from '@/models/Progress';
import QuizAttempt from '@/models/QuizAttempt';
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

    const courses = await Course.find({ instructor: userId }).select('_id title').lean();
    const courseIds = courses.map((course) => course._id);

    if (!courseIds.length) {
      return NextResponse.json({ items: [] });
    }

    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } }).lean();

    const studentIds = [...new Set(enrollments.map((enrollment: { studentId: string }) => enrollment.studentId))];
    const users = await User.find({ _id: { $in: studentIds } }).select('_id name email').lean();

    const [progressRows, attempts] = await Promise.all([
      Progress.find({ courseId: { $in: courseIds }, studentId: { $in: studentIds } })
        .select('courseId studentId isCompleted')
        .lean(),
      QuizAttempt.find({ courseId: { $in: courseIds }, studentId: { $in: studentIds } })
        .select('courseId studentId percentage score maxScore submittedAt')
        .sort({ submittedAt: -1 })
        .lean(),
    ]);

    const courseMap = new Map(courses.map((course: { _id: { toString: () => string }; title: string }) => [course._id.toString(), course.title]));
    const userMap = new Map(
      users.map((user: { _id: string; name?: string; email?: string }) => [user._id, user])
    );

    const progressMap = new Map<string, { completed: number; total: number }>();
    for (const row of progressRows as Array<{ courseId: { toString: () => string }; studentId: string; isCompleted: boolean }>) {
      const key = `${row.studentId}:${row.courseId.toString()}`;
      const existing = progressMap.get(key) || { completed: 0, total: 0 };
      existing.total += 1;
      if (row.isCompleted) existing.completed += 1;
      progressMap.set(key, existing);
    }

    const scoreMap = new Map<string, { averagePercentage: number; latestPercentage: number; attempts: number }>();
    for (const attempt of attempts as Array<{ courseId: { toString: () => string }; studentId: string; percentage?: number }>) {
      const key = `${attempt.studentId}:${attempt.courseId.toString()}`;
      const current = scoreMap.get(key);
      const percentage = Number(attempt.percentage) || 0;
      if (!current) {
        scoreMap.set(key, {
          averagePercentage: percentage,
          latestPercentage: percentage,
          attempts: 1,
        });
      } else {
        const attemptsCount = current.attempts + 1;
        current.averagePercentage = ((current.averagePercentage * current.attempts) + percentage) / attemptsCount;
        current.attempts = attemptsCount;
        scoreMap.set(key, current);
      }
    }

    const items = enrollments.map((enrollment: any) => {
      const courseId = enrollment.courseId?.toString?.() || String(enrollment.courseId);
      const key = `${enrollment.studentId}:${courseId}`;
      const user = userMap.get(enrollment.studentId);
      const progressMetrics = progressMap.get(key);
      const scoreMetrics = scoreMap.get(key);

      const lessonProgress =
        progressMetrics && progressMetrics.total > 0
          ? Math.round((progressMetrics.completed / progressMetrics.total) * 100)
          : Number(enrollment.progress || 0);

      return {
        enrollmentId: enrollment._id,
        studentId: enrollment.studentId,
        studentName: user?.name || 'Student',
        studentEmail: user?.email || '',
        initials: (user?.name || 'ST')
          .split(' ')
          .filter(Boolean)
          .map((part) => part[0])
          .slice(0, 2)
          .join('')
          .toUpperCase(),
        courseId,
        courseTitle: courseMap.get(courseId) || 'Course',
        enrollmentStatus: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        progress: Math.min(100, Math.max(0, lessonProgress)),
        quizAverageScore: scoreMetrics ? Math.round(scoreMetrics.averagePercentage) : 0,
        latestQuizScore: scoreMetrics ? Math.round(scoreMetrics.latestPercentage) : 0,
        quizAttempts: scoreMetrics?.attempts || 0,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching teacher students:', error);
    return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
  }
}
