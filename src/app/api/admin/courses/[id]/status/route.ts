import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import { getEffectiveRole } from '@/lib/auth';

const ALLOWED_STATUS = ['Draft', 'Published', 'Archived'] as const;

type CourseStatus = (typeof ALLOWED_STATUS)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const body = await req.json();
    const status = String(body.status || '') as CourseStatus;
    if (!ALLOWED_STATUS.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await connectDB();
    const course = await Course.findByIdAndUpdate(
      id,
      { $set: { status, updatedAt: new Date() } },
      { new: true }
    ).lean();

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    return NextResponse.json({ success: true, status: (course as any).status });
  } catch (error) {
    console.error('Error updating course status:', error);
    return NextResponse.json({ error: 'Failed to update course status' }, { status: 500 });
  }
}
