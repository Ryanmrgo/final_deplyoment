import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import { getEffectiveRole } from '@/lib/auth';

const isLessonType = (value: string) => ['video', 'pdf', 'ppt', 'text'].includes(value);

const ensureOwnership = async (courseId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return { error: NextResponse.json({ error: 'Invalid course ID' }, { status: 400 }) };
  }

  const course = await Course.findOne({ _id: courseId, instructor: userId }).lean();
  if (!course) {
    return { error: NextResponse.json({ error: 'Course not found' }, { status: 404 }) };
  }

  return { course };
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });

  try {
    const body = await req.json();
    await connectDB();

    const { id, lessonId } = await params;
    const ownership = await ensureOwnership(id, userId);
    if (ownership.error) return ownership.error;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title !== undefined) updates.title = String(body.title || '').trim();
    if (body.description !== undefined) updates.description = String(body.description || '').trim();
    if (body.sectionTitle !== undefined) updates.sectionTitle = String(body.sectionTitle || '').trim();
    if (body.content !== undefined) updates.content = String(body.content || '').trim();
    if (body.fileUrl !== undefined) updates.fileUrl = String(body.fileUrl || '').trim();
    if (body.duration !== undefined) updates.duration = Number(body.duration) || 0;
    if (body.order !== undefined) updates.order = Number(body.order) || 0;
    if (body.isPublished !== undefined) updates.isPublished = Boolean(body.isPublished);
    if (body.type !== undefined && typeof body.type === 'string' && isLessonType(body.type)) {
      updates.type = body.type;
    }

    if (typeof updates.title === 'string' && !updates.title) {
      return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 });
    }

    const lesson = await Lesson.findOneAndUpdate(
      { _id: lessonId, courseId: id },
      { $set: updates },
      { new: true }
    ).lean();

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });

  try {
    await connectDB();

    const { id, lessonId } = await params;
    const ownership = await ensureOwnership(id, userId);
    if (ownership.error) return ownership.error;

    if (!mongoose.Types.ObjectId.isValid(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const removed = await Lesson.findOneAndDelete({ _id: lessonId, courseId: id });
    if (!removed) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    const remaining = await Lesson.find({ courseId: id }).sort({ order: 1, createdAt: 1 }).lean();
    await Promise.all(
      remaining.map((lesson, index) =>
        Lesson.updateOne({ _id: lesson._id }, { $set: { order: index, updatedAt: new Date() } })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
