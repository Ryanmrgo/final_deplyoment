"use client";

import clsx from 'clsx';

export type LessonSidebarItem = {
  _id: string;
  title: string;
  lessonOrder: number;
};

type LessonListSidebarProps = {
  lessons: LessonSidebarItem[];
  currentLessonId: string | null;
  completedLessonIds?: string[];
  onSelectLesson: (lessonId: string) => void;
};

export function LessonListSidebar({
  lessons,
  currentLessonId,
  completedLessonIds = [],
  onSelectLesson,
}: LessonListSidebarProps) {
  return (
    <aside className="rounded-lg border bg-white p-3">
      <h3 className="mb-3 text-sm font-semibold text-gray-900">Lessons</h3>
      <div className="space-y-2">
        {lessons.map((lesson, index) => {
          const isActive = currentLessonId === lesson._id;
          const isDone = completedLessonIds.includes(lesson._id);

          return (
            <button
              key={lesson._id}
              type="button"
              onClick={() => onSelectLesson(lesson._id)}
              className={clsx(
                'w-full rounded-md border px-3 py-2 text-left text-sm transition',
                isActive ? 'border-blue-500 bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate">
                  {index + 1}. {lesson.title}
                </span>
                {isDone ? <span className="text-xs text-green-600">Done</span> : null}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
