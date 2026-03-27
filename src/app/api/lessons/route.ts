import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import Enrollment from '@/models/Enrollment';
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
      resourceType: file.type.startsWith('video/') ? 'image' : 'raw',
    });
  }

  return saveFileLocally(file);
};

export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const course = await Course.findById(courseId).lean();
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const isOwner = (course as any).instructor?.toString() === userId;
    const isStudent = role === 'student';
    const isTeacher = role === 'teacher';

    if (isTeacher && !isOwner) {
      return NextResponse.json({ error: 'Only course owner can access these lessons' }, { status: 403 });
    }

    if (isStudent) {
      const enrollment = await Enrollment.findOne({ courseId, studentId: userId }).lean();
      if (!enrollment) {
        return NextResponse.json({ error: 'Enroll in this course to view lessons' }, { status: 403 });
      }
    } else if (!isOwner && role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const query: Record<string, unknown> = { courseId };
    if (isStudent) {
      query.$or = [{ isPublished: true }, { isPublished: { $exists: false } }];
    }

    const rawItems = await Lesson.find(query).sort({ lessonOrder: 1, order: 1, createdAt: 1 }).lean();
    const items = rawItems.map((item: any) => {
      const derivedVideo =
        item.video?.url
          ? item.video
          : item.youtubeUrl
            ? { type: 'youtube', url: item.youtubeUrl }
            : item.fileUrl && (item.contentType === 'video' || item.type === 'video')
              ? { type: 'upload', url: item.fileUrl }
              : null;

      const derivedFiles =
        Array.isArray(item.files) && item.files.length
          ? item.files
          : item.fileUrl && !derivedVideo
            ? [
                {
                  fileName: `Lesson file.${item.fileType || 'file'}`,
                  fileUrl: item.fileUrl,
                  fileType: item.fileType || 'file',
                },
              ]
            : [];

      return {
        ...item,
        lessonOrder: Number.isFinite(Number(item.lessonOrder)) ? Number(item.lessonOrder) : Number(item.order) || 0,
        video: derivedVideo,
        files: derivedFiles,
      };
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  try {
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

    const courseId = typeof body.courseId === 'string' ? body.courseId : '';
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return NextResponse.json({ error: 'Valid courseId is required' }, { status: 400 });
    }

    const course = await Course.findOne({ _id: courseId, instructor: userId }).lean();
    if (!course) {
      return NextResponse.json({ error: 'Course not found or not owned by teacher' }, { status: 404 });
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const requestedType = typeof body.contentType === 'string' ? body.contentType : '';
    const contentTypeValue = isValidLessonContentType(requestedType) ? requestedType : null;
    const videoTypeInput =
      typeof body.videoType === 'string' && ['upload', 'youtube'].includes(body.videoType)
        ? (body.videoType as 'upload' | 'youtube')
        : null;
    const youtubeUrlInput = typeof body.youtubeUrl === 'string' ? body.youtubeUrl.trim() : '';
    const fileUrlInput = typeof body.fileUrl === 'string' ? body.fileUrl.trim() : '';
    const lessonOrderInput = Number(body.lessonOrder);

    if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });
    let lessonVideo: { type: 'upload' | 'youtube'; url: string } | null = null;
    let lessonFilesPayload: Array<{ fileName: string; fileUrl: string; fileType: string }> = [];

    // New combined payload (videoType + videoFile + lessonFiles)
    if (videoTypeInput || lessonFiles.length > 0) {
      if (videoTypeInput === 'youtube') {
        const videoId = parseYoutubeVideoId(youtubeUrlInput);
        if (!videoId) {
          return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }
        lessonVideo = { type: 'youtube', url: toYoutubeEmbedUrl(videoId) };
      } else if (videoTypeInput === 'upload') {
        if (!videoFile) {
          return NextResponse.json({ error: 'Video file is required for upload video type' }, { status: 400 });
        }
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
        lessonVideo = { type: 'upload', url: uploadedVideo.url };
      }

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
        lessonFilesPayload.push({
          fileName: lessonFile.name,
          fileUrl: uploaded.url,
          fileType: getFileTypeLabel(lessonFile.name),
        });
      }

      if (!lessonVideo && lessonFilesPayload.length === 0) {
        return NextResponse.json(
          { error: 'At least one video or one file is required for a lesson' },
          { status: 400 }
        );
      }
    } else {
      // Backward-compatible old payload
      if (!contentTypeValue) {
        return NextResponse.json({ error: 'contentType must be one of video, youtube, document' }, { status: 400 });
      }

      let fileUrl = fileUrlInput;
      let fileType = typeof body.fileType === 'string' ? body.fileType.trim().toLowerCase() : '';
      let youtubeUrl = '';

      if (contentTypeValue === 'youtube') {
        const videoId = parseYoutubeVideoId(youtubeUrlInput);
        if (!videoId) {
          return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
        }
        youtubeUrl = toYoutubeEmbedUrl(videoId);
        lessonVideo = { type: 'youtube', url: youtubeUrl };
      } else {
        if (videoFile) {
          if (videoFile.size > MAX_LESSON_UPLOAD_BYTES) {
            return NextResponse.json(
              { error: `File size exceeds ${LESSON_MAX_UPLOAD_MB}MB limit` },
              { status: 400 }
            );
          }
          if (!isSupportedLessonFile(videoFile.name)) {
            return NextResponse.json({ error: 'Unsupported file format' }, { status: 400 });
          }
          const uploaded = await uploadLessonFile(videoFile);
          fileUrl = uploaded.url;
          fileType = getFileTypeLabel(videoFile.name);
        }

        if (!fileUrl) {
          return NextResponse.json({ error: 'A lesson file is required for video/document' }, { status: 400 });
        }

        if (contentTypeValue === 'video') {
          lessonVideo = { type: 'upload', url: fileUrl };
        } else {
          lessonFilesPayload = [
            {
              fileName: `Lesson file.${fileType || 'file'}`,
              fileUrl,
              fileType: fileType || 'file',
            },
          ];
        }
      }
    }

    const maxOrderLesson = await Lesson.findOne({ courseId }).sort({ lessonOrder: -1, order: -1 }).lean();
    const nextOrder = Number.isFinite(lessonOrderInput)
      ? Math.max(0, lessonOrderInput)
      : (maxOrderLesson?.lessonOrder ?? maxOrderLesson?.order ?? -1) + 1;

    const legacyContentType =
      lessonVideo?.type === 'youtube'
        ? 'youtube'
        : lessonVideo
          ? 'video'
          : 'document';
    const firstFileType = lessonFilesPayload[0]?.fileType || '';
    const legacyType =
      legacyContentType === 'youtube' || legacyContentType === 'video'
        ? 'video'
        : firstFileType === 'ppt' || firstFileType === 'pptx'
          ? 'ppt'
          : firstFileType === 'pdf'
            ? 'pdf'
            : 'text';

    const lesson = await Lesson.create({
      courseId: new mongoose.Types.ObjectId(courseId),
      title,
      description,
      video: lessonVideo,
      files: lessonFilesPayload,
      contentType: legacyContentType,
      fileUrl: lessonVideo?.type === 'upload' ? lessonVideo.url : lessonFilesPayload[0]?.fileUrl || '',
      youtubeUrl: lessonVideo?.type === 'youtube' ? lessonVideo.url : '',
      fileType: firstFileType,
      lessonOrder: nextOrder,
      order: nextOrder,
      type: legacyType,
      content: lessonVideo?.type === 'youtube' ? lessonVideo.url : '',
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
