import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
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

    const totalStudents = courses.reduce((sum: number, c: any) => sum + (c.totalStudents || 0), 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const enrollmentsThisMonth = await Enrollment.countDocuments({
      courseId: { $in: courseIds },
      enrolledAt: { $gte: monthStart },
    });

    const completedEnrollments = await Enrollment.countDocuments({
      courseId: { $in: courseIds },
      status: 'Completed',
    });

    const totalEnrollments = await Enrollment.countDocuments({
      courseId: { $in: courseIds },
    });

    const avgRating =
      courses.length > 0
        ? courses.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / courses.length
        : 0;

    const completionRate = totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    const reviewsThisMonth = courses.reduce((sum: number, c: any) => {
      const reviews = c.reviews || [];
      return sum + reviews.filter((r: any) => new Date(r.createdAt) >= monthStart).length;
    }, 0);

    return NextResponse.json({
      totalStudents,
      activeCourses: courses.filter((c: any) => c.status === 'Published').length,
      averageRating: avgRating.toFixed(1),
      completionRate,
      newEnrollmentsThisMonth: enrollmentsThisMonth,
      courseCompletionsThisMonth: await Enrollment.countDocuments({
        courseId: { $in: courseIds },
        status: 'Completed',
        completedAt: { $gte: monthStart },
      }),
      newReviewsThisMonth: reviewsThisMonth,
    });
  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
