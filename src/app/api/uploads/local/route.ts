import { NextResponse } from 'next/server';
import { getEffectiveRole } from '@/lib/auth';
import { saveFileLocally } from '@/lib/localUpload';
import { useCloudinaryForStorage } from '@/lib/uploadStrategy';

const MAX_DEFAULT_BYTES = 20 * 1024 * 1024;
const MAX_THUMB_BYTES = 5 * 1024 * 1024;

const TEACHER_FOLDERS = new Set([
  'assignments',
  'course-lessons',
  'lessons',
  'syllabi',
  'course-syllabi',
  'thumbnails',
  'course-thumbnails',
]);

const STUDENT_FOLDERS = new Set(['submissions']);

const SAFE_EXT = new Set([
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'txt',
  'md',
  'csv',
  'zip',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'gif',
  'mp4',
  'webm',
  'mov',
  'mkv',
  'avi',
  'mp3',
]);

function extOf(name: string) {
  const base = name.split('.').pop()?.toLowerCase() || '';
  return base;
}

export async function POST(req: Request) {
  if (useCloudinaryForStorage()) {
    return NextResponse.json(
      { error: 'Local uploads are disabled; server is configured for Cloudinary.' },
      { status: 400 }
    );
  }

  const { userId, role } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart form data' }, { status: 400 });
  }

  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  let folder = String(formData.get('folder') || 'course-lessons').trim();
  if (folder === 'lessons') folder = 'course-lessons';

  if (role === 'teacher') {
    if (!TEACHER_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Invalid folder for teacher upload' }, { status: 400 });
    }
  } else if (role === 'student') {
    if (!STUDENT_FOLDERS.has(folder)) {
      return NextResponse.json({ error: 'Invalid folder for student upload' }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: 'Only teachers and students may upload files here' }, { status: 403 });
  }

  const ext = extOf(file.name);
  if (folder === 'thumbnails' || folder === 'course-thumbnails') {
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return NextResponse.json({ error: 'Thumbnail must be JPG, PNG, or WEBP' }, { status: 400 });
    }
    if (file.size > MAX_THUMB_BYTES) {
      return NextResponse.json({ error: 'Thumbnail exceeds 5MB' }, { status: 400 });
    }
  } else {
    if (ext && !SAFE_EXT.has(ext)) {
      return NextResponse.json({ error: `Unsupported file type: .${ext}` }, { status: 400 });
    }
    if (file.size > MAX_DEFAULT_BYTES) {
      return NextResponse.json({ error: 'File exceeds 20MB limit' }, { status: 400 });
    }
  }

  try {
    const storeFolder =
      folder === 'course-thumbnails'
        ? 'thumbnails'
        : folder === 'lessons'
          ? 'course-lessons'
          : folder === 'course-syllabi'
            ? 'syllabi'
            : folder;
    const saved = await saveFileLocally(file, storeFolder);
    return NextResponse.json({
      url: saved.url,
      name: saved.name,
      type: saved.type,
      size: file.size,
    });
  } catch (e: unknown) {
    console.error('Local upload error:', e);
    const message = e instanceof Error ? e.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
