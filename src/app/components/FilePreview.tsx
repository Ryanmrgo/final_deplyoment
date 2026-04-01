"use client";

import type { FileAsset } from '@/lib/fileAsset';

interface FilePreviewProps {
  file: FileAsset;
}

const isImage = (mimeType: string, extension: string) =>
  mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension);

const isVideo = (mimeType: string, extension: string) =>
  mimeType.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(extension);

const isAudio = (mimeType: string, extension: string) =>
  mimeType.startsWith('audio/') || ['mp3', 'wav'].includes(extension);

const isPdf = (mimeType: string, extension: string) =>
  mimeType === 'application/pdf' || extension === 'pdf';

export function FilePreview({ file }: FilePreviewProps) {
  const ext = String(file.extension || '').toLowerCase();
  const mime = String(file.mimeType || '').toLowerCase();

  return (
    <div className="rounded-md border p-3 space-y-2 bg-white">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <span className="text-[10px] rounded bg-gray-100 px-2 py-1 uppercase">{ext || 'file'}</span>
      </div>

      {isPdf(mime, ext) ? (
        <iframe src={file.url} className="w-full h-64 rounded border" title={file.name} />
      ) : null}

      {isImage(mime, ext) ? (
        <img src={file.url} alt={file.name} className="max-h-64 w-auto rounded border" />
      ) : null}

      {isVideo(mime, ext) ? (
        <video controls className="w-full max-h-72 rounded border">
          <source src={file.url} />
        </video>
      ) : null}

      {isAudio(mime, ext) ? (
        <audio controls className="w-full">
          <source src={file.url} />
        </audio>
      ) : null}

      <div className="flex gap-2">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#1E3A8A] underline"
        >
          Open
        </a>
        <a href={file.url} download className="text-xs text-gray-700 underline">
          Download
        </a>
      </div>
    </div>
  );
}
