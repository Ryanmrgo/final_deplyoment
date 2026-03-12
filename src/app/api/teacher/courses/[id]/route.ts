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
  let syllabusFiles: File[] = [];
  let syllabusLabels: string[] = [];

  if (isMultipart) {
    const formData = await req.formData();
    body = Object.fromEntries(
      Array.from(formData.entries()).filter(([, value]) => typeof value === 'string')
    );
    const syllabusEntry = formData.get('syllabus');
    const thumbnailEntry = formData.get('thumbnail');
    const syllabusFileEntries = formData.getAll('syllabusFiles');
    const syllabusLabelEntries = formData.getAll('syllabusLabels');
    syllabusFile = syllabusEntry instanceof File ? syllabusEntry : null;
    thumbnailFile = thumbnailEntry instanceof File ? thumbnailEntry : null;
    syllabusFiles = syllabusFileEntries.filter((entry): entry is File => entry instanceof File);
    syllabusLabels = syllabusLabelEntries.filter((entry): entry is string => typeof entry === 'string');
  } else {
    body = await req.json().catch(() => ({}));
  }

  let requestedSyllabusMaterials: Array<{ label: string; url: string; name: string; type: string }> | null = null;
  if (typeof body.syllabusMaterials === 'string') {
    try {
      const parsed = JSON.parse(body.syllabusMaterials);
      if (Array.isArray(parsed)) {
        requestedSyllabusMaterials = parsed
          .filter((item: any) => item && typeof item.url === 'string' && item.url.trim())
          .map((item: any) => ({
            label: String(item.label || item.name || 'Syllabus').trim() || 'Syllabus',
            url: String(item.url || '').trim(),
            name: String(item.name || '').trim(),
            type: String(item.type || '').trim(),
          }));
      }
    } catch {
      return NextResponse.json({ error: 'Invalid syllabusMaterials payload' }, { status: 400 });
    }
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

    let existingSyllabusMaterials = Array.isArray((course as any).syllabusMaterials)
      ? (course as any).syllabusMaterials
          .filter((item: any) => item && item.url)
          .map((item: any) => ({
            label: String(item.label || 'Syllabus'),
            url: String(item.url || ''),
            name: String(item.name || ''),
            type: String(item.type || ''),
          }))
      : [];

    if (!existingSyllabusMaterials.length && (course as any).syllabusUrl) {
      existingSyllabusMaterials.push({
        label: String((course as any).syllabusName || 'Syllabus'),
        url: String((course as any).syllabusUrl),
        name: String((course as any).syllabusName || ''),
        type: String((course as any).syllabusType || ''),
      });
    }

    if (requestedSyllabusMaterials) {
      existingSyllabusMaterials = requestedSyllabusMaterials;
      updates.syllabusMaterials = requestedSyllabusMaterials;

      if (requestedSyllabusMaterials.length === 0) {
        updates.syllabusUrl = '';
        updates.syllabusName = '';
        updates.syllabusType = '';
      } else {
        const primary = requestedSyllabusMaterials[0];
        updates.syllabusUrl = primary.url;
        updates.syllabusName = primary.name || primary.label;
        updates.syllabusType = primary.type;
      }
    }

    const uploadedSyllabusMaterials: Array<{ label: string; url: string; name: string; type: string }> = [];

    if (syllabusFiles.length > 0) {
      for (let index = 0; index < syllabusFiles.length; index += 1) {
        const file = syllabusFiles[index];
        validateUpload(file, {
          maxBytes: MAX_SYLLABUS_BYTES,
          allowedMimes: SYLLABUS_MIME_TYPES,
          allowedExtensions: SYLLABUS_EXTENSIONS,
        });

        const upload = await uploadToCloudinary(file, {
          folder: 'course-syllabi',
          resourceType: 'raw',
        });

        uploadedSyllabusMaterials.push({
          label: syllabusLabels[index]?.trim() || `Material ${existingSyllabusMaterials.length + index + 1}`,
          url: upload.url,
          name: upload.name,
          type: upload.type,
        });
      }
    }

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

      if (uploadedSyllabusMaterials.length === 0) {
        uploadedSyllabusMaterials.push({
          label: typeof body.syllabusName === 'string' && body.syllabusName.trim() ? body.syllabusName.trim() : 'Syllabus',
          url: syllabusUpload.url,
          name: syllabusUpload.name,
          type: syllabusUpload.type,
        });
      }
    }

    if (uploadedSyllabusMaterials.length > 0) {
      const mergedSyllabusMaterials = [...existingSyllabusMaterials, ...uploadedSyllabusMaterials];
      updates.syllabusMaterials = mergedSyllabusMaterials;

      const primarySyllabus = mergedSyllabusMaterials[0];
      if (primarySyllabus) {
        updates.syllabusUrl = primarySyllabus.url;
        updates.syllabusName = primarySyllabus.name || primarySyllabus.label;
        updates.syllabusType = primarySyllabus.type;
      }
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
