"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/button';
import { LessonListSidebar } from '@/app/components/LessonListSidebar';
import { VideoPlayer } from '@/app/components/VideoPlayer';
import { DocumentViewer } from '@/app/components/DocumentViewer';

type LessonItem = {
  _id: string;
  title: string;
  description?: string;
  video?: { type: 'upload' | 'youtube'; url: string } | null;
  files?: Array<{ fileName: string; fileUrl: string; fileType: string }>;
  lessonOrder: number;
};

type ProgressItem = {
  lessonId: string;
  isCompleted: boolean;
};

export default function CourseLearnPage({ params }: { params: { id: string } }) {
  const courseId = params.id;
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [progressItems, setProgressItems] = useState<ProgressItem[]>([]);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [lessonsRes, progressRes] = await Promise.all([
        fetch(`/api/lessons?courseId=${courseId}`),
        fetch(`/api/student/progress?courseId=${courseId}`),
      ]);

      const lessonsData = await lessonsRes.json();
      if (!lessonsRes.ok) throw new Error(lessonsData.error || 'Failed to load lessons');

      const sortedLessons = (lessonsData.items || []).sort(
        (a: LessonItem, b: LessonItem) => a.lessonOrder - b.lessonOrder
      );
      setLessons(sortedLessons);
      setCurrentLessonId(sortedLessons[0]?._id || null);

      if (progressRes.ok) {
        const progressData = await progressRes.json();
        setProgressItems(progressData.items || []);
      } else {
        setProgressItems([]);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load learning content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const currentLesson = useMemo(
    () => lessons.find((item) => item._id === currentLessonId) || null,
    [currentLessonId, lessons]
  );

  const completedLessonIds = useMemo(
    () =>
      progressItems
        .filter((item) => item.isCompleted)
        .map((item) => item.lessonId),
    [progressItems]
  );

  const completionPercent = lessons.length
    ? Math.round((completedLessonIds.length / lessons.length) * 100)
    : 0;

  const markCompleted = async () => {
    if (!currentLesson) return;
    await fetch('/api/student/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        lessonId: currentLesson._id,
        isCompleted: true,
      }),
    });
    loadData();
  };

  const currentIndex = lessons.findIndex((item) => item._id === currentLessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Learning Player</h1>
          <Link href={`/courses/${courseId}`}>
            <Button variant="outline">Back to course</Button>
          </Link>
        </div>
        <p className="text-sm text-gray-700">Completion: {completionPercent}%</p>

        {loading ? <p className="text-sm text-gray-600">Loading lessons...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <LessonListSidebar
                lessons={lessons}
                currentLessonId={currentLessonId}
                completedLessonIds={completedLessonIds}
                onSelectLesson={setCurrentLessonId}
              />
            </div>
            <div className="lg:col-span-3">
              {!currentLesson ? (
                <div className="rounded-lg border bg-white p-4 text-sm text-gray-600">No lessons available.</div>
              ) : (
                <div className="space-y-4 rounded-lg border bg-white p-4">
                  <h2 className="text-xl font-semibold text-gray-900">{currentLesson.title}</h2>
                  {currentLesson.description ? (
                    <p className="text-sm text-gray-700">{currentLesson.description}</p>
                  ) : null}

                  {currentLesson.video?.url ? (
                    <VideoPlayer
                      type={currentLesson.video.type === 'youtube' ? 'youtube' : 'video'}
                      sourceUrl={currentLesson.video.url}
                    />
                  ) : null}

                  {currentLesson.files?.length ? (
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-gray-900">Lesson Files</h3>
                      <div className="space-y-3">
                        {currentLesson.files.map((file, idx) => (
                          <div key={`${file.fileUrl}-${idx}`} className="rounded-md border p-3">
                            <p className="text-sm font-medium text-gray-900">{file.fileName || `File ${idx + 1}`}</p>
                            <DocumentViewer fileUrl={file.fileUrl} fileType={file.fileType} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button variant="outline" disabled={!prevLesson} onClick={() => prevLesson && setCurrentLessonId(prevLesson._id)}>
                      Previous
                    </Button>
                    <Button variant="outline" disabled={!nextLesson} onClick={() => nextLesson && setCurrentLessonId(nextLesson._id)}>
                      Next
                    </Button>
                    <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={markCompleted}>
                      Mark as completed
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
