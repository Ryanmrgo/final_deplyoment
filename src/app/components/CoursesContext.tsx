"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { courses as baseCourses } from '@/app/data/mockData';

export type LessonAttachment = { name: string; type: string; dataUrl: string };
export type LessonItem = string | { title: string; files?: LessonAttachment[] };
export type SyllabusSection = { id: string; title: string; lessons: LessonItem[] };

export type Course = Omit<(typeof baseCourses)[number], 'syllabus'> & {
  syllabus: SyllabusSection[];
  isPublished?: boolean;
  learningOutcomes?: string[];
};

interface CoursesContextValue {
  allCourses: Course[];
  publicCourses: Course[];
  createdCourses: Course[];
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
}

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);
const STORAGE_KEY = 'alinhub.createdCourses.v1';
const EDITS_STORAGE_KEY = 'alinhub.editedCourses.v1';

function readStoredCourses(): Course[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Course[]) : [];
  } catch {
    return [];
  }
}

function writeStoredCourses(courses: Course[]) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

function readStoredEdits(): Record<string, Course> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(EDITS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Course>) : {};
  } catch {
    return {};
  }
}

function writeStoredEdits(edits: Record<string, Course>) {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(EDITS_STORAGE_KEY, JSON.stringify(edits));
}

export function CoursesProvider({ children }: { children: React.ReactNode }) {
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [editedCourses, setEditedCourses] = useState<Record<string, Course>>({});
  const hasLoaded = useRef(false);

  useEffect(() => {
    setCreatedCourses(readStoredCourses());
    setEditedCourses(readStoredEdits());
    hasLoaded.current = true;
  }, []);

  useEffect(() => {
    if (hasLoaded.current) {
      writeStoredCourses(createdCourses);
      writeStoredEdits(editedCourses);
    }
  }, [createdCourses, editedCourses]);

  const addCourse = useCallback((course: Course) => {
    setCreatedCourses((prev) => [course, ...prev]);
  }, []);

  const updateCourse = useCallback((id: string, updates: Partial<Course>) => {
    setCreatedCourses((prev) => {
      const existsInCreated = prev.some((course) => course.id === id);
      if (!existsInCreated) {
        return prev;
      }
      return prev.map((course) => (course.id === id ? { ...course, ...updates } : course));
    });

    const baseMatch = baseCourses.find((course) => course.id === id);
    if (baseMatch) {
      setEditedCourses((prev) => ({
        ...prev,
        [id]: { ...baseMatch, ...prev[id], ...updates, id },
      }));
    }
  }, []);

  const mergedBaseCourses = useMemo(
    () => baseCourses.map((course) => ({ ...course, ...(editedCourses[course.id] ?? {}) })),
    [editedCourses]
  );
  const allCourses = useMemo(() => [...mergedBaseCourses, ...createdCourses], [createdCourses, mergedBaseCourses]);
  const publicCourses = useMemo(
    () => allCourses.filter((course) => course.isPublished !== false),
    [allCourses]
  );

  const value = useMemo<CoursesContextValue>(
    () => ({ allCourses, publicCourses, createdCourses, addCourse, updateCourse }),
    [allCourses, publicCourses, createdCourses, addCourse, updateCourse]
  );

  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>;
}

export function useCourses() {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
}
