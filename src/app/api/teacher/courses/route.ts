import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import { getEffectiveRole } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function GET() {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  try {
    await connectDB();
    const courses = await Course.find({ instructor: userId }).sort({ createdAt: -1 });
    return NextResponse.json({ items: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

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

export async function POST(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
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
    body = await req.json();
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  if (!description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }

  try {
    await connectDB();
    const uploadsEnabled = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
    let syllabusUpload: { url: string; name: string; type: string } | null = null;
    let thumbnailUpload: { url: string; name: string; type: string } | null = null;
    let syllabusMaterials: { label: string; url: string; name: string; type: string }[] = [];

    if (uploadsEnabled && syllabusFiles.length > 0) {
      syllabusMaterials = await Promise.all(
        syllabusFiles.map(async (file, index) => {
          validateUpload(file, {
            maxBytes: MAX_SYLLABUS_BYTES,
            allowedMimes: SYLLABUS_MIME_TYPES,
            allowedExtensions: SYLLABUS_EXTENSIONS,
          });
          const upload = await uploadToCloudinary(file, {
            folder: 'course-syllabi',
            resourceType: 'raw',
          });
          const label = syllabusLabels[index]?.trim() || `Label ${index + 1}`;
          return {
            label,
            url: upload.url,
            name: upload.name,
            type: upload.type,
          };
        })
      );
    }

    if (uploadsEnabled && syllabusMaterials.length === 0 && syllabusFile) {
      validateUpload(syllabusFile, {
        maxBytes: MAX_SYLLABUS_BYTES,
        allowedMimes: SYLLABUS_MIME_TYPES,
        allowedExtensions: SYLLABUS_EXTENSIONS,
      });
      syllabusUpload = await uploadToCloudinary(syllabusFile, {
        folder: 'course-syllabi',
        resourceType: 'raw',
      });
    }

    if (uploadsEnabled && thumbnailFile) {
      validateUpload(thumbnailFile, {
        maxBytes: MAX_THUMBNAIL_BYTES,
        allowedMimes: THUMBNAIL_MIME_TYPES,
        allowedExtensions: THUMBNAIL_EXTENSIONS,
      });
      thumbnailUpload = await uploadToCloudinary(thumbnailFile, {
        folder: 'course-thumbnails',
        resourceType: 'image',
      });
    }

    if (uploadsEnabled && syllabusMaterials.length === 0 && !syllabusUpload && !body.syllabusUrl) {
      return NextResponse.json({ error: 'syllabus file is required' }, { status: 400 });
    }

    // Thumbnail is optional; leave empty if not provided.

    const duration = Number(body.duration ?? 0) || 0;
    const price = Number(body.price ?? 0) || 0;
    const level = typeof body.level === 'string' ? body.level : 'Beginner';

    const course = new Course({
      title,
      description,
      instructor: userId,
      category: typeof body.category === 'string' && body.category ? body.category : 'General',
      level,
      duration,
      image: (thumbnailUpload?.url ?? body.image ?? '') as string,
      price,
      status: body.status || 'Draft', // Draft = hidden from students (Moodle style); teacher publishes when ready
      syllabusUrl: (syllabusMaterials[0]?.url ?? syllabusUpload?.url ?? body.syllabusUrl ?? '') as string,
      syllabusName: (syllabusMaterials[0]?.name ?? syllabusUpload?.name ?? body.syllabusName ?? '') as string,
      syllabusType: (syllabusMaterials[0]?.type ?? syllabusUpload?.type ?? body.syllabusType ?? '') as string,
      syllabusMaterials,
      language: typeof body.language === 'string' && body.language ? body.language : 'English',
      requirements: typeof body.requirements === 'string' ? body.requirements : '',
      outcomes: typeof body.outcomes === 'string' ? body.outcomes : '',
    });
    await course.save();
    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Error creating course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create course';

    if (errorMessage.includes('Cloudinary environment variables are not set')) {
      return NextResponse.json(
        { error: 'File upload is not configured. Please set CLOUDINARY environment variables.' },
        { status: 500 }
      );
    }

    if (errorMessage.includes('Unsupported file type') || errorMessage.includes('File size exceeds limit')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    return NextResponse.json({ error: errorMessage || 'Failed to create course' }, { status: 500 });
  }
}
