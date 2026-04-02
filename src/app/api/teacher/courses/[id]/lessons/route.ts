import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import { getEffectiveRole } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { saveFileLocally } from '@/lib/localUpload';
import { useCloudinaryForStorage } from '@/lib/uploadStrategy';
import { notifyEnrolledStudentsLessonPublished } from '@/lib/notifications';
import { LESSON_MAX_UPLOAD_MB, MAX_LESSON_UPLOAD_BYTES } from '@/lib/lesson';

const isLessonType = (value: string) => ['video', 'pdf', 'ppt', 'text'].includes(value);

const LESSON_EXTENSIONS = ['.pdf', '.ppt', '.pptx', '.doc', '.docx'];

const validateLessonFile = (file: File) => {
  if (file.size > MAX_LESSON_UPLOAD_BYTES) {
    throw new Error(`Lesson file size exceeds ${LESSON_MAX_UPLOAD_MB}MB limit`);
  }

  const ext = `.${file.name.split('.').pop() || ''}`.toLowerCase();
  if (!LESSON_EXTENSIONS.includes(ext)) {
    throw new Error('Unsupported lesson file type');
  }
};

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
  const { userId } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
  const { userId } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let body: Record<string, unknown> = {};
    let lessonFile: File | null = null;

    if (isMultipart) {
      const formData = await req.formData();
      body = Object.fromEntries(
        Array.from(formData.entries()).filter(([, value]) => typeof value === 'string')
      );
      const fileEntry = formData.get('lessonFile');
      lessonFile = fileEntry instanceof File ? fileEntry : null;
    } else {
      body = await req.json();
    }

    await connectDB();

    const { id } = await params;
    const ownership = await ensureOwnership(id, userId);
    if (ownership.error) return ownership.error;

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const sectionTitle = typeof body.sectionTitle === 'string' ? body.sectionTitle.trim() : '';
    const requestedType =
      typeof body.type === 'string' && isLessonType(body.type) ? (body.type as string) : 'text';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const fileUrlFromBody = typeof body.fileUrl === 'string' ? body.fileUrl.trim() : '';
    const duration = Number(body.duration) || 0;

    if (!title) {
      return NextResponse.json({ error: 'Lesson title is required' }, { status: 400 });
    }

    let fileUrl = fileUrlFromBody;
    let type = requestedType;

    if (lessonFile) {
      validateLessonFile(lessonFile);
      const upload = useCloudinaryForStorage()
        ? await uploadToCloudinary(lessonFile, {
            folder: 'course-lessons',
            resourceType: 'raw',
          })
        : await saveFileLocally(lessonFile, 'course-lessons');
      fileUrl = upload.url;

      // For uploaded docs, coerce to a document type understood by Lesson.type
      if (requestedType === 'text' || requestedType === 'video') {
        type = 'pdf';
      } else {
        type = requestedType;
      }
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

    const courseDoc = ownership.course as { title?: string };
    if ((lesson as { isPublished?: boolean }).isPublished !== false) {
      await notifyEnrolledStudentsLessonPublished({
        courseId: id,
        courseTitle: String(courseDoc.title || 'Course'),
        lessonTitle: title,
        lessonId: String(lesson._id),
      });
    }

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
  const { userId } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
