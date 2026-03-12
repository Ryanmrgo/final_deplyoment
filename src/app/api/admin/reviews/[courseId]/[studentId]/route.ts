import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import { getEffectiveRole } from '@/lib/auth';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ courseId: string; studentId: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    const { courseId, studentId } = await params;
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    await connectDB();

    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    course.reviews = (course.reviews || []).filter((review: any) => review.studentId !== studentId);
    const reviews = course.reviews || [];
    course.rating = reviews.length
      ? Number((reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(2))
      : 0;
    course.updatedAt = new Date();
    await course.save();

    return NextResponse.json({ success: true, rating: course.rating, reviewCount: reviews.length });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
