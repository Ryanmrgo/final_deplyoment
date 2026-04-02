import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import CourseDeletionRequest from '@/models/CourseDeletionRequest';
import { getEffectiveRole } from '@/lib/auth';

/** GET — pending request courseIds for current teacher (dashboard badges). */
export async function GET() {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 401 });
  }

  try {
    await connectDB();
    const items = await CourseDeletionRequest.find({
      teacherId: userId,
      status: 'pending',
    })
      .select('courseId courseTitle status createdAt')
      .lean();

    return NextResponse.json({
      items: items.map((r: any) => ({
        id: String(r._id),
        courseId: String(r.courseId),
        courseTitle: r.courseTitle,
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 });
  }
}
