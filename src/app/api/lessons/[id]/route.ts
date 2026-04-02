import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import { getEffectiveRole } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { saveFileLocally } from '@/lib/localUpload';
import {
  LESSON_MAX_UPLOAD_MB,
  MAX_LESSON_UPLOAD_BYTES,
  getFileTypeLabel,
  isSupportedLessonFile,
  isValidLessonContentType,
  parseYoutubeVideoId,
  toYoutubeEmbedUrl,
} from '@/lib/lesson';

const canUseCloudinary = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const uploadLessonFile = async (file: File) => {
  if (canUseCloudinary()) {
    return uploadToCloudinary(file, {
      folder: 'course-lessons',
      resourceType: file.type.startsWith('video/') ? 'video' : 'raw',
    });
  }
  return saveFileLocally(file);
};

const checkOwnership = async (lessonId: string, userId: string) => {
  const lesson = await Lesson.findById(lessonId).lean();
  if (!lesson) return { error: NextResponse.json({ error: 'Lesson not found' }, { status: 404 }) };

  const course = await Course.findOne({ _id: lesson.courseId, instructor: userId }).lean();
  if (!course) {
    return { error: NextResponse.json({ error: 'Only course owner can update lessons' }, { status: 403 }) };
  }

  return { lesson };
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    let body: Record<string, unknown> = {};
    let videoFile: File | null = null;
    let lessonFiles: File[] = [];

    if (isMultipart) {
      const formData = await req.formData();
      body = Object.fromEntries(
        Array.from(formData.entries()).filter(([, value]) => typeof value === 'string')
      );
      const maybeVideoFile = formData.get('videoFile') ?? formData.get('file');
      videoFile = maybeVideoFile instanceof File ? maybeVideoFile : null;
      lessonFiles = formData
        .getAll('lessonFiles')
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);
    } else {
      body = await req.json();
    }

    await connectDB();
    const ownership = await checkOwnership(id, userId);
    if (ownership.error) return ownership.error;

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    const contentTypeValue =
      typeof body.contentType === 'string' && isValidLessonContentType(body.contentType)
        ? body.contentType
        : null;

    if (body.title !== undefined) {
      const title = String(body.title || '').trim();
      if (!title) return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 });
      updates.title = title;
    }
    if (body.description !== undefined) updates.description = String(body.description || '').trim();
    if (body.lessonOrder !== undefined) updates.lessonOrder = Math.max(0, Number(body.lessonOrder) || 0);
    if (body.isPublished !== undefined) updates.isPublished = Boolean(body.isPublished);
    const clearVideo = body.clearVideo === true || body.clearVideo === 'true';
    const clearFiles = body.clearFiles === true || body.clearFiles === 'true';
    const videoTypeInput =
      typeof body.videoType === 'string' && ['upload', 'youtube'].includes(body.videoType)
        ? (body.videoType as 'upload' | 'youtube')
        : null;

    if (contentTypeValue) {
      updates.contentType = contentTypeValue;
    }

    const existingFiles =
      Array.isArray((ownership.lesson as any).files) && !clearFiles
        ? ((ownership.lesson as any).files as Array<{ fileName: string; fileUrl: string; fileType: string }>)
        : [];
    const filesPayload = [...existingFiles];

    for (const lessonFile of lessonFiles) {
      if (lessonFile.size > MAX_LESSON_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `File size exceeds ${LESSON_MAX_UPLOAD_MB}MB limit` },
          { status: 400 }
        );
      }
      if (!isSupportedLessonFile(lessonFile.name)) {
        return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
      }
      const uploaded = await uploadLessonFile(lessonFile);
      filesPayload.push({
        fileName: lessonFile.name,
        fileUrl: uploaded.url,
        fileType: getFileTypeLabel(lessonFile.name),
      });
    }

    let nextVideo =
      clearVideo
        ? null
        : (ownership.lesson as any).video?.url
          ? ((ownership.lesson as any).video as { type: 'upload' | 'youtube'; url: string })
          : null;

    if (videoTypeInput === 'youtube') {
      const youtubeInput = typeof body.youtubeUrl === 'string' ? body.youtubeUrl.trim() : '';
      const idFromUrl = parseYoutubeVideoId(youtubeInput);
      if (!idFromUrl) return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
      nextVideo = { type: 'youtube', url: toYoutubeEmbedUrl(idFromUrl) };
    } else if (videoTypeInput === 'upload' && videoFile) {
      if (videoFile.size > MAX_LESSON_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: `File size exceeds ${LESSON_MAX_UPLOAD_MB}MB limit` },
          { status: 400 }
        );
      }
      if (!isSupportedLessonFile(videoFile.name)) {
        return NextResponse.json({ error: 'Unsupported video file format' }, { status: 400 });
      }
      const uploadedVideo = await uploadLessonFile(videoFile);
      nextVideo = { type: 'upload', url: uploadedVideo.url };
    }

    if (!nextVideo && filesPayload.length === 0) {
      return NextResponse.json(
        { error: 'A lesson must contain at least one video or one file' },
        { status: 400 }
      );
    }

    const legacyContentType = nextVideo?.type === 'youtube' ? 'youtube' : nextVideo ? 'video' : 'document';
    const firstFileType = filesPayload[0]?.fileType || '';
    updates.video = nextVideo;
    updates.files = filesPayload;
    updates.contentType = legacyContentType;
    updates.fileUrl = nextVideo?.type === 'upload' ? nextVideo.url : filesPayload[0]?.fileUrl || '';
    updates.youtubeUrl = nextVideo?.type === 'youtube' ? nextVideo.url : '';
    updates.fileType = firstFileType;
    updates.type =
      legacyContentType === 'video' || legacyContentType === 'youtube'
        ? 'video'
        : firstFileType === 'pdf'
          ? 'pdf'
          : firstFileType.includes('ppt')
            ? 'ppt'
            : 'text';
    updates.content = nextVideo?.type === 'youtube' ? nextVideo.url : '';

    if (updates.lessonOrder !== undefined) {
      updates.order = updates.lessonOrder;
    }

    const lesson = await Lesson.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    return NextResponse.json({ success: true, lesson });
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    await connectDB();
    const ownership = await checkOwnership(id, userId);
    if (ownership.error) return ownership.error;

    await Lesson.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
}
