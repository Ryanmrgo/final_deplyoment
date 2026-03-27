"use client";

import { Button } from '@/app/components/ui/button';

type DocumentViewerProps = {
  fileUrl: string;
  fileType?: string;
};

export function DocumentViewer({ fileUrl, fileType = '' }: DocumentViewerProps) {
  if (!fileUrl) return null;

  const normalized = fileType.toLowerCase();
  const canPreviewPdf = normalized === 'pdf' || fileUrl.toLowerCase().includes('.pdf');

  if (canPreviewPdf) {
    return (
      <div className="space-y-3">
        <iframe title="PDF lesson" src={fileUrl} className="h-[480px] w-full rounded-lg border" />
        <a href={fileUrl} target="_blank" rel="noreferrer">
          <Button variant="outline">Open PDF in new tab</Button>
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-gray-700 mb-3">
        Preview is not available for this file type. Download to view this lesson.
      </p>
      <a href={fileUrl} target="_blank" rel="noreferrer">
        <Button>Download lesson file</Button>
      </a>
    </div>
  );
}
