import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import { getEffectiveRole } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

const MAX_SYLLABUS_BYTES = 20 * 1024 * 1024;
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;
const SYLLABUS_MIME_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];
const SYLLABUS_EXTENSIONS = ['.pdf', '.ppt', '.pptx'];
const THUMBNAIL_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const THUMBNAIL_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const validateUpload = (file: File, options: { maxBytes: number; allowedMimes: string[]; allowedExtensions: string[] }) => {
  if (file.size > options.maxBytes) {
    throw new Error('File size exceeds limit');
  }

  const ext = `.${file.name.split('.').pop() || ''}`.toLowerCase();
  if (!options.allowedExtensions.includes(ext)) {
    throw new Error('Unsupported file type');
  }

  if (file.type && !options.allowedMimes.includes(file.type)) {
    throw new Error('Unsupported file type');
  }
};

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

  const contentType = req.headers.get('content-type') || '';
  const isMultipart = contentType.includes('multipart/form-data');
  let body: Record<string, unknown> = {};
  let syllabusFile: File | null = null;
  let thumbnailFile: File | null = null;

  if (isMultipart) {
    const formData = await req.formData();
    body = Object.fromEntries(
      Array.from(formData.entries()).filter(([, value]) => typeof value === 'string')
    );
    const syllabusEntry = formData.get('syllabus');
    const thumbnailEntry = formData.get('thumbnail');
    syllabusFile = syllabusEntry instanceof File ? syllabusEntry : null;
    thumbnailFile = thumbnailEntry instanceof File ? thumbnailEntry : null;
  } else {
    body = await req.json().catch(() => ({}));
  }

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
    if (body.duration !== undefined) updates.duration = Number(body.duration) || 0;
    if (body.image !== undefined) updates.image = body.image;
    if (body.price !== undefined) updates.price = Number(body.price) || 0;
    if (body.syllabusUrl !== undefined) updates.syllabusUrl = body.syllabusUrl;
    if (body.syllabusName !== undefined) updates.syllabusName = body.syllabusName;
    if (body.syllabusType !== undefined) updates.syllabusType = body.syllabusType;
    if (body.language !== undefined) updates.language = body.language;
    if (body.requirements !== undefined) updates.requirements = body.requirements;
    if (body.outcomes !== undefined) updates.outcomes = body.outcomes;

    if (syllabusFile) {
      validateUpload(syllabusFile, {
        maxBytes: MAX_SYLLABUS_BYTES,
        allowedMimes: SYLLABUS_MIME_TYPES,
        allowedExtensions: SYLLABUS_EXTENSIONS,
      });
      const syllabusUpload = await uploadToCloudinary(syllabusFile, {
        folder: 'course-syllabi',
        resourceType: 'raw',
      });
      updates.syllabusUrl = syllabusUpload.url;
      updates.syllabusName = syllabusUpload.name;
      updates.syllabusType = syllabusUpload.type;
    }

    if (thumbnailFile) {
      validateUpload(thumbnailFile, {
        maxBytes: MAX_THUMBNAIL_BYTES,
        allowedMimes: THUMBNAIL_MIME_TYPES,
        allowedExtensions: THUMBNAIL_EXTENSIONS,
      });
      const thumbnailUpload = await uploadToCloudinary(thumbnailFile, {
        folder: 'course-thumbnails',
        resourceType: 'image',
      });
      updates.image = thumbnailUpload.url;
    }

    Object.assign(course, updates);
    await course.save();

    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}
