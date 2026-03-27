import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
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

    const enrollments = await Enrollment.find({ studentId: userId }).lean();

    const coursesEnrolled = enrollments.length;
    const coursesCompleted = enrollments.filter((e: any) => e.status === 'Completed').length;
    const certificatesEarned = enrollments.filter((e: any) => e.certificate?.issued).length;

    const courseIds = enrollments.map((e: any) => e.courseId);
    const courses = await Course.find({ _id: { $in: courseIds } }).lean();

    const totalDuration = courses.reduce((sum: number, c: any) => sum + (c.duration || 0), 0);
    const avgProgress = enrollments.reduce((sum: number, e: any) => sum + (e.progress || 0), 0) / (enrollments.length || 1);
    const hoursLearned = Math.round((totalDuration * avgProgress) / 100);

    const achievements: { id: string; title: string; icon: string; date: string }[] = [];
    if (coursesCompleted >= 1) {
      achievements.push({
        id: '1',
        title: 'First Course Completed',
        icon: '🎓',
        date: new Date().toISOString().split('T')[0],
      });
    }
    if (coursesEnrolled >= 3) {
      achievements.push({
        id: '2',
        title: 'Dedicated Learner',
        icon: '📚',
        date: new Date().toISOString().split('T')[0],
      });
    }
    if (certificatesEarned >= 1) {
      achievements.push({
        id: '3',
        title: 'Certificate Earned',
        icon: '🏆',
        date: new Date().toISOString().split('T')[0],
      });
    }
    if (achievements.length === 0) {
      achievements.push({
        id: '0',
        title: 'Get started by completing your first course!',
        icon: '🌟',
        date: '',
      });
    }

    return NextResponse.json({
      coursesEnrolled,
      coursesCompleted,
      certificatesEarned,
      hoursLearned,
      achievements,
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
