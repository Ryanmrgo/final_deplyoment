import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import { getEffectiveRole } from '@/lib/auth';

export async function GET() {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  try {
    await connectDB();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalUsers, newUsersThisMonth, totalCourses, activeCourses, totalEnrollments] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: monthStart } }),
      Course.countDocuments(),
      Course.countDocuments({ status: 'Published' }),
      Enrollment.countDocuments(),
    ]);

    return NextResponse.json({
      totalUsers,
      newUsersThisMonth,
      totalCourses,
      activeCourses,
      totalEnrollments,
      completionRate: totalEnrollments > 0
        ? Math.round((await Enrollment.countDocuments({ status: 'Completed' }) / totalEnrollments) * 100)
        : 0,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
