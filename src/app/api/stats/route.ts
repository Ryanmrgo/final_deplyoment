import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';

export async function GET() {
  try {
    await connectDB();

    const [freeCourses, certificatesIssued, activeLearnersAgg] = await Promise.all([
      Course.countDocuments({ status: 'Published' }),
      Enrollment.countDocuments({ 'certificate.issued': true }),
      Enrollment.aggregate([
        { $match: { status: 'Active' } },
        { $group: { _id: '$studentId' } },
        { $count: 'total' },
      ]),
    ]);

    const activeLearners = Array.isArray(activeLearnersAgg) && activeLearnersAgg.length > 0
      ? Number(activeLearnersAgg[0].total) || 0
      : 0;

    return NextResponse.json({
      activeLearners,
      freeCourses,
      certificatesIssued,
    });
  } catch (error) {
    console.error('GET /api/stats error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch platform stats',
        activeLearners: 0,
        freeCourses: 0,
        certificatesIssued: 0,
      },
      { status: 500 }
    );
  }
}
