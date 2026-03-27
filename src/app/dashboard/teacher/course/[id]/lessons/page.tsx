"use client";

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { LessonUploadForm } from '@/app/components/LessonUploadForm';
import { Button } from '@/app/components/ui/button';

type LessonItem = {
  _id: string;
  title: string;
  contentType: 'video' | 'youtube' | 'document';
  fileType?: string;
  lessonOrder: number;
};

export default function TeacherCourseLessonsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLessons = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/lessons?courseId=${courseId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load lessons');
      setLessons((data.items || []).sort((a: LessonItem, b: LessonItem) => a.lessonOrder - b.lessonOrder));
    } catch (e: any) {
      setError(e?.message || 'Failed to load lessons');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLessons();
  }, [courseId]);

  const removeLesson = async (lessonId: string) => {
    const res = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
    if (res.ok) loadLessons();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Manage Lessons</h1>
          <Link href={`/dashboard/teacher/course/${courseId}`}>
            <Button variant="outline">Back to course settings</Button>
          </Link>
        </div>

        <LessonUploadForm courseId={courseId} onCreated={loadLessons} />

        <div className="rounded-lg border bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">Lesson List</h2>
          {loading ? <p className="text-sm text-gray-600">Loading lessons...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!loading && !error && lessons.length === 0 ? (
            <p className="text-sm text-gray-600">No lessons yet.</p>
          ) : null}
          <div className="space-y-2">
            {lessons.map((lesson) => (
              <div key={lesson._id} className="flex items-center justify-between rounded border p-3">
                <p className="text-sm text-gray-800">
                  {lesson.lessonOrder + 1}. {lesson.title} ({lesson.contentType}
                  {lesson.fileType ? `/${lesson.fileType}` : ''})
                </p>
                <Button variant="outline" className="text-red-600" onClick={() => removeLesson(lesson._id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
