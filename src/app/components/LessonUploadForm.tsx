"use client";

import { useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { FileUploader } from '@/app/components/FileUploader';
import { uploadFileToCloudinary } from '@/lib/cloudinaryClient';

type LessonUploadFormProps = {
  courseId: string;
  onCreated?: () => void;
};

export function LessonUploadForm({ courseId, onCreated }: LessonUploadFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState<'video' | 'youtube' | 'document'>('document');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [supportingFile, setSupportingFile] = useState<File | null>(null);
  const [lessonOrder, setLessonOrder] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const accept = useMemo(() => {
    if (contentType === 'video') return '.mp4,.mkv,.avi,.mov,.webm';
    return '.pdf,.ppt,.pptx,.doc,.docx';
  }, [contentType]);

  const getFileType = (fileName: string) => fileName.split('.').pop()?.toLowerCase() || 'file';

  const submit = async () => {
    if (!title.trim()) {
      setMessage('Lesson title is required.');
      return;
    }

    if (contentType === 'youtube' && !youtubeUrl.trim()) {
      setMessage('YouTube URL is required.');
      return;
    }

    if (contentType !== 'youtube' && !file) {
      setMessage('Please upload a lesson file.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    try {
      const payload: Record<string, unknown> = {
        courseId,
        title: title.trim(),
        description: description.trim(),
        lessonOrder: String(Number(lessonOrder) || 0),
        contentType,
      };

      const lessonFiles: Array<{ fileName: string; fileUrl: string; fileType: string }> = [];

      if (contentType === 'youtube') {
        payload.videoType = 'youtube';
        payload.youtubeUrl = youtubeUrl.trim();
      } else if (file) {
        if (contentType === 'video') {
          const uploaded = await uploadFileToCloudinary(file, {
            folder: 'course-lessons',
            resourceType: 'video',
          });
          payload.videoType = 'upload';
          payload.videoUrl = uploaded.url;
        } else {
          const uploaded = await uploadFileToCloudinary(file, {
            folder: 'course-lessons',
            resourceType: 'raw',
          });
          lessonFiles.push({
            fileName: uploaded.name,
            fileUrl: uploaded.url,
            fileType: getFileType(uploaded.name || file.name),
          });
        }
      }

      if ((contentType === 'video' || contentType === 'youtube') && supportingFile) {
        const uploadedSupport = await uploadFileToCloudinary(supportingFile, {
          folder: 'course-lessons',
          resourceType: 'raw',
        });
        lessonFiles.push({
          fileName: uploadedSupport.name,
          fileUrl: uploadedSupport.url,
          fileType: getFileType(uploadedSupport.name || supportingFile.name),
        });
      }

      if (lessonFiles.length > 0) {
        payload.lessonFiles = lessonFiles;
      }

      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || 'Failed to create lesson.');
        return;
      }

      setTitle('');
      setDescription('');
      setYoutubeUrl('');
      setFile(null);
      setSupportingFile(null);
      setMessage('Lesson created successfully.');
      onCreated?.();
    } catch {
      setMessage('Failed to create lesson.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <h3 className="text-lg font-semibold">Add Lesson</h3>

      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title" />
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short lesson description"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Content Type</Label>
        <select
          value={contentType}
          onChange={(e) => setContentType(e.target.value as 'video' | 'youtube' | 'document')}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="document">Document</option>
          <option value="video">Video file</option>
          <option value="youtube">YouTube link</option>
        </select>
      </div>

      {contentType === 'youtube' ? (
        <div className="space-y-1.5">
          <Label>YouTube URL</Label>
          <Input
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>{contentType === 'video' ? 'Upload Video File' : 'Upload Document File'}</Label>
          <FileUploader accept={accept} onFileSelect={setFile} />
        </div>
      )}

      {contentType !== 'document' ? (
        <div className="space-y-1.5">
          <Label>Upload Supporting File (Optional)</Label>
          <FileUploader
            accept=".pdf,.ppt,.pptx,.doc,.docx"
            onFileSelect={setSupportingFile}
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label>Lesson Order</Label>
        <Input
          type="number"
          min="0"
          value={lessonOrder}
          onChange={(e) => setLessonOrder(e.target.value)}
          placeholder="0"
        />
      </div>

      <Button onClick={submit} disabled={isSubmitting} className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90">
        {isSubmitting ? 'Saving...' : 'Create lesson'}
      </Button>
      {message ? <p className="text-sm text-gray-700">{message}</p> : null}
    </div>
  );
}
