import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import EnrollmentRequest from '@/models/EnrollmentRequest';
import { getEffectiveRole } from '@/lib/auth';

export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  try {
    await connectDB();

    const url = new URL(req.url);
    const statusParam = String(url.searchParams.get('status') || 'all').toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected') {
      query.status = statusParam;
    }

    const [requests, total] = await Promise.all([
      EnrollmentRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('studentId', '_id name email')
        .populate('courseId', '_id title')
        .lean(),
      EnrollmentRequest.countDocuments(query),
    ]);

    const items = requests.map((item: any) => ({
      id: String(item._id),
      studentId: item.studentId?._id || item.studentId,
      studentName: item.studentId?.name || item.fullName,
      studentEmail: item.studentId?.email || '',
      courseId: item.courseId?._id || item.courseId,
      courseName: item.courseId?.title || 'Unknown Course',
      fullName: item.fullName,
      age: item.age,
      educationalBackground: item.educationalBackground,
      reasonForJoining: item.reasonForJoining,
      status: item.status,
      createdAt: item.createdAt,
    }));

    return NextResponse.json({
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        status: statusParam,
      },
    });
  } catch (error) {
    console.error('Error fetching admin enrollment requests:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollment requests' }, { status: 500 });
  }
}
