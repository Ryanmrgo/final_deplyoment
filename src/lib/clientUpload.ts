'use client';

import { uploadFileToCloudinary } from '@/lib/cloudinaryClient';

export type ClientUploadFolder =
  | 'assignments'
  | 'submissions'
  | 'course-lessons'
  | 'syllabi'
  | 'course-syllabi'
  | 'thumbnails'
  | 'course-thumbnails';

type CloudinaryOpts = {
  folder: string;
  resourceType?: 'image' | 'raw' | 'video';
};

/** Mirrors USE_LOCAL_UPLOADS for the browser (set in .env.local when using local files). */
function publicPrefersLocalUploads(): boolean {
  const v = String(process.env.NEXT_PUBLIC_USE_LOCAL_UPLOADS ?? '')
    .trim()
    .replace(/\r$/, '')
    .toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
}

async function getUploadMode(): Promise<'local' | 'cloudinary'> {
  try {
    const res = await fetch('/api/uploads/config', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('config failed');
    return data.mode === 'local' ? 'local' : 'cloudinary';
  } catch {
    return publicPrefersLocalUploads() ? 'local' : 'cloudinary';
  }
}

/**
 * Upload a file using the same strategy as the server (local disk vs Cloudinary).
 */
export async function uploadUserFile(
  file: File,
  opts: ClientUploadFolder | CloudinaryOpts
): Promise<{ url: string; name: string; type: string; resourceType?: 'image' | 'raw' | 'video' }> {
  const folderOpt = typeof opts === 'string' ? { folder: opts, resourceType: 'raw' as const } : opts;
  const mode = await getUploadMode();

  if (mode === 'local') {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folderOpt.folder);
    const res = await fetch('/api/uploads/local', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Local upload failed');
    }
    return {
      url: data.url,
      name: data.name || file.name,
      type: data.type || file.type || '',
      resourceType: folderOpt.resourceType === 'image' ? 'image' : 'raw',
    };
  }

  return uploadFileToCloudinary(file, {
    folder: folderOpt.folder,
    resourceType: folderOpt.resourceType ?? 'raw',
  });
}
