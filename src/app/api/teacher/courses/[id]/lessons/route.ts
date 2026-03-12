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

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });

  try {
    await connectDB();
    const { id } = await params;
    const ownership = await ensureOwnership(id, userId);
    if (ownership.error) return ownership.error;

    const items = await Lesson.find({ courseId: id })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching teacher lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });

  try {
    const body = await req.json();
    await connectDB();

    const { id } = await params;
    const ownership = await ensureOwnership(id, userId);
    if (ownership.error) return ownership.error;

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const sectionTitle = typeof body.sectionTitle === 'string' ? body.sectionTitle.trim() : '';
    const type = typeof body.type === 'string' && isLessonType(body.type) ? body.type : 'text';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const fileUrl = typeof body.fileUrl === 'string' ? body.fileUrl.trim() : '';
    const duration = Number(body.duration) || 0;

    if (!title) {
      return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 });
    }

    const maxOrderLesson = await Lesson.findOne({ courseId: id }).sort({ order: -1 }).lean();

    const lesson = await Lesson.create({
      courseId: new mongoose.Types.ObjectId(id),
      title,
      description,
      sectionTitle,
      type,
      content,
      fileUrl,
      duration,
      order: (maxOrderLesson?.order ?? -1) + 1,
      isPublished: body.isPublished !== false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, lesson }, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });

  try {
    const body = await req.json();
    await connectDB();

    const { id } = await params;
    const ownership = await ensureOwnership(id, userId);
    if (ownership.error) return ownership.error;

    const lessonOrders = Array.isArray(body.lessonOrders) ? body.lessonOrders : [];
    if (!lessonOrders.length) {
      return NextResponse.json({ error: 'lessonOrders is required' }, { status: 400 });
    }

    await Promise.all(
      lessonOrders
        .filter((item: unknown) => {
          if (!item || typeof item !== 'object') return false;
          const typedItem = item as { lessonId?: string; order?: number };
          return Boolean(typedItem.lessonId && Number.isFinite(Number(typedItem.order)));
        })
        .map((item: { lessonId: string; order: number }) =>
          Lesson.updateOne(
            { _id: item.lessonId, courseId: id },
            { $set: { order: Number(item.order), updatedAt: new Date() } }
          )
        )
    );

    const items = await Lesson.find({ courseId: id }).sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Error reordering lessons:', error);
    return NextResponse.json({ error: 'Failed to reorder lessons' }, { status: 500 });
  }
}
