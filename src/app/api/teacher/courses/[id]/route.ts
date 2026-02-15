import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import { getEffectiveRole } from '@/lib/auth';

/**
 * PATCH - Update course (e.g. publish/unpublish, edit settings).
 * Moodle-like: teacher can change visibility (Draft = Hidden, Published = Visible).
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    await connectDB();
    const course = await Course.findOne({ _id: id, instructor: userId });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.status && ['Draft', 'Published', 'Archived'].includes(body.status)) {
      updates.status = body.status;
    }
    if (body.title !== undefined) updates.title = body.title;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category !== undefined) updates.category = body.category;
    if (body.level !== undefined) updates.level = body.level;
    if (body.duration !== undefined) updates.duration = body.duration;
    if (body.image !== undefined) updates.image = body.image;
    if (body.price !== undefined) updates.price = body.price;

    Object.assign(course, updates);
    await course.save();

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}
