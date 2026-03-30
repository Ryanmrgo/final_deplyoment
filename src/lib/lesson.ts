export const LESSON_CONTENT_TYPES = ['video', 'youtube', 'document'] as const;
export const ALLOWED_LESSON_EXTENSIONS = [
  '.pdf',
  '.ppt',
  '.pptx',
  '.doc',
  '.docx',
  '.mp4',
  '.mkv',
  '.avi',
  '.mov',
  '.webm',
  '.txt',
] as const;
export const DEFAULT_LESSON_MAX_UPLOAD_MB = 500;

const envLessonMaxUploadMB = Number(process.env.LESSON_MAX_UPLOAD_MB);
export const LESSON_MAX_UPLOAD_MB =
  Number.isFinite(envLessonMaxUploadMB) && envLessonMaxUploadMB > 0
    ? envLessonMaxUploadMB
    : DEFAULT_LESSON_MAX_UPLOAD_MB;

export const MAX_LESSON_UPLOAD_BYTES = LESSON_MAX_UPLOAD_MB * 1024 * 1024;

export const isValidLessonContentType = (value: string): value is (typeof LESSON_CONTENT_TYPES)[number] =>
  LESSON_CONTENT_TYPES.includes(value as (typeof LESSON_CONTENT_TYPES)[number]);

export const getFileExtension = (name: string) => `.${name.split('.').pop() || ''}`.toLowerCase();

export const isSupportedLessonFile = (name: string) =>
  ALLOWED_LESSON_EXTENSIONS.includes(getFileExtension(name) as (typeof ALLOWED_LESSON_EXTENSIONS)[number]);

export const getFileTypeLabel = (name: string) => getFileExtension(name).replace('.', '') || 'file';

export const parseYoutubeVideoId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id && id.length >= 6 ? id : null;
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id && id.length >= 6 ? id : null;
      }

      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' || parts[0] === 'shorts') {
        const id = parts[1];
        return id && id.length >= 6 ? id : null;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const toYoutubeEmbedUrl = (videoId: string) => `https://www.youtube.com/embed/${videoId}`;
