export type FileAsset = {
  url: string;
  name: string;
  mimeType: string;
  extension: string;
  size?: number;
};

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
};

const isSafeUrl = (value: string) =>
  value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/uploads/');

export const inferExtension = (value: string) => {
  const withoutQuery = value.split('?')[0].split('#')[0];
  const parts = withoutQuery.split('.');
  if (parts.length <= 1) return '';
  return String(parts[parts.length - 1] || '').trim().toLowerCase();
};

export const inferMimeType = (extension: string, fallback = '') =>
  MIME_BY_EXT[String(extension || '').toLowerCase()] || fallback || 'application/octet-stream';

export const normalizeFileAsset = (input: unknown): FileAsset | null => {
  if (!input) return null;

  if (typeof input === 'string') {
    const url = input.trim();
    if (!url || !isSafeUrl(url)) return null;
    const extension = inferExtension(url);
    const fallbackName = decodeURIComponent(url.split('/').pop() || 'attachment');
    return {
      url,
      name: fallbackName,
      extension,
      mimeType: inferMimeType(extension),
    };
  }

  if (typeof input === 'object') {
    const raw = input as Record<string, unknown>;
    const url = String(raw.url || '').trim();
    if (!url || !isSafeUrl(url)) return null;
    const name = String(raw.name || raw.fileName || decodeURIComponent(url.split('/').pop() || 'attachment')).trim();
    const ext = String(raw.extension || inferExtension(String(raw.name || '')) || inferExtension(url)).toLowerCase();
    const mimeType = String(raw.mimeType || raw.type || inferMimeType(ext)).trim();
    const sizeValue = Number(raw.size);

    return {
      url,
      name: name || 'attachment',
      extension: ext,
      mimeType: mimeType || inferMimeType(ext),
      ...(Number.isFinite(sizeValue) && sizeValue > 0 ? { size: sizeValue } : {}),
    };
  }

  return null;
};

export const normalizeFileAssets = (input: unknown): FileAsset[] => {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => normalizeFileAsset(item))
    .filter((item): item is FileAsset => Boolean(item));
};
