// app/components/CoursesContext.tsx - UPDATED VERSION
"use client";

import { courses as baseCourses } from '@/app/data/mockData';
import { Course, Review } from '@/app/types/index'; // UPDATED: Added Assignment
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

// =============== TYPES ===============
export type AssignmentSubmission = {
  id: string;
  assignmentId: string;
  courseId: string;
  userId: string;
  studentName: string;
  submittedAt: string;
  fileUrl?: string;
  text?: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded';
  attachments?: any[]; // ADDED: To match shared type
};

export type UserReview = {
  rating: number;
  comment: string;
  date: string;
  courseId: string;
};

interface CoursesContextValue {
  allCourses: Course[];
  publicCourses: Course[];
  createdCourses: Course[];
  addCourse: (course: Course) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;

  // Enrollment functions
  enrollInCourse: (courseId: string) => void;
  removeEnrollment: (courseId: string) => void; // NEW: Remove enrollment
  isEnrolled: (courseId: string) => boolean;
  getUserEnrolledCourses: () => Course[];
  getEnrollmentDate: (courseId: string) => string | null;

  // Review functions
  submitReview: (courseId: string, rating: number, comment: string) => void;
  updateReview: (courseId: string, rating: number, comment: string) => void;
  removeReview: (courseId: string) => void;
  hasUserReviewed: (courseId: string) => boolean;
  getUserReview: (courseId: string) => Review | null;
  updateCourseProgress: (courseId: string, progress: number, completedLessons: number) => void;

  // Assignment functions
  submitAssignment: (courseId: string, assignmentId: string, submission: { fileUrl?: string; text?: string }) => void;
  getAssignmentSubmission: (courseId: string, assignmentId: string) => AssignmentSubmission | null;
  gradeAssignment: (courseId: string, assignmentId: string, grade: number, feedback: string) => void;
}

const CoursesContext = createContext<CoursesContextValue | undefined>(undefined);

// =============== STORAGE KEYS ===============
const STORAGE_KEY = 'alinhub.createdCourses.v1';
const EDITS_STORAGE_KEY = 'alinhub.editedCourses.v1';
const ENROLLMENT_STORAGE_KEY = 'alinhub.enrollments.v1';
const REVIEWS_STORAGE_KEY = 'alinhub.userReviews.v1';
const PROGRESS_STORAGE_KEY = 'alinhub.userProgress.v1';
const ASSIGNMENT_SUBMISSIONS_KEY = 'alinhub.assignmentSubmissions.v1';

// =============== STORAGE FUNCTIONS ===============
function readStoredCourses(): Course[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStoredCourses(courses: Course[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

function readStoredEdits(): Record<string, Partial<Course>> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(EDITS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredEdits(edits: Record<string, Partial<Course>>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EDITS_STORAGE_KEY, JSON.stringify(edits));
}

function readStoredEnrollments(): Record<string, { date: string; progress: number; completedLessons: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ENROLLMENT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredEnrollments(enrollments: Record<string, { date: string; progress: number; completedLessons: number }>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(enrollments));
}

function readStoredReviews(): Record<string, UserReview> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(REVIEWS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredReviews(reviews: Record<string, UserReview>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
}

function readStoredProgress(): Record<string, { progress: number; completedLessons: number }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredProgress(progress: Record<string, { progress: number; completedLessons: number }>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

function readStoredAssignmentSubmissions(): Record<string, AssignmentSubmission> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ASSIGNMENT_SUBMISSIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStoredAssignmentSubmissions(submissions: Record<string, AssignmentSubmission>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ASSIGNMENT_SUBMISSIONS_KEY, JSON.stringify(submissions));
}

// =============== PROVIDER COMPONENT ===============
export function CoursesProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [createdCourses, setCreatedCourses] = useState<Course[]>([]);
  const [editedCourses, setEditedCourses] = useState<Record<string, Partial<Course>>>({});
  const [userEnrollments, setUserEnrollments] = useState<Record<string, { date: string; progress: number; completedLessons: number }>>({});
  const [userReviews, setUserReviews] = useState<Record<string, UserReview>>({});
  const [userProgress, setUserProgress] = useState<Record<string, { progress: number; completedLessons: number }>>({});
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const hasLoaded = useRef(false);

  // Load all data from localStorage on mount
  useEffect(() => {
    setCreatedCourses(readStoredCourses());
    setEditedCourses(readStoredEdits());
    setUserEnrollments(readStoredEnrollments());
    setUserReviews(readStoredReviews());
    setUserProgress(readStoredProgress());
    setAssignmentSubmissions(readStoredAssignmentSubmissions());
    hasLoaded.current = true;
  }, []);

  // =============== COURSE DATA MERGING ===============
  const mergedBaseCourses = useMemo(() => {
    return baseCourses.map((course) => {
      const enrollment = userEnrollments[course.id];
      const progress = userProgress[course.id] || { progress: 0, completedLessons: 0 };

      return {
        ...course,
        ...(editedCourses[course.id] ?? {}),
        isEnrolled: Boolean(enrollment),
        enrollmentDate: enrollment?.date,
        userProgress: progress.progress,
        userCompletedLessons: progress.completedLessons
      };
    });
  }, [editedCourses, userEnrollments, userProgress]);

  const allCourses = useMemo(() => [...mergedBaseCourses, ...createdCourses], [createdCourses, mergedBaseCourses]);

  const publicCourses = useMemo(() => {
    return allCourses.filter((course) => course.isPublished !== false);
  }, [allCourses]);

  // Save data to localStorage when it changes
  useEffect(() => {
    if (hasLoaded.current) {
      writeStoredCourses(createdCourses);
      writeStoredEdits(editedCourses);
      writeStoredEnrollments(userEnrollments);
      writeStoredReviews(userReviews);
      writeStoredProgress(userProgress);
      writeStoredAssignmentSubmissions(assignmentSubmissions);
    }
  }, [createdCourses, editedCourses, userEnrollments, userReviews, userProgress, assignmentSubmissions]);

  // =============== COURSE MANAGEMENT ===============
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

  // =============== ENROLLMENT FUNCTIONS ===============
  const enrollInCourse = useCallback((courseId: string) => {
    const enrollmentDate = new Date().toISOString().split('T')[0];

    setUserEnrollments(prev => ({
      ...prev,
      [courseId]: {
        date: enrollmentDate,
        progress: 0,
        completedLessons: 0
      }
    }));

    // Update course student count
    const course = allCourses.find(c => c.id === courseId);
    if (course) {
      // For base courses, update in editedCourses
      const baseCourse = baseCourses.find(c => c.id === courseId);
      if (baseCourse) {
        setEditedCourses(prev => ({
          ...prev,
          [courseId]: {
            ...baseCourse,
            ...prev[courseId],
            students: (prev[courseId]?.students || baseCourse.students || 0) + 1,
            isEnrolled: true,
            enrollmentDate
          }
        }));
      } else {
        // For created courses, update in createdCourses
        setCreatedCourses(prev => prev.map(c =>
          c.id === courseId
            ? {
              ...c,
              students: (c.students || 0) + 1,
              isEnrolled: true,
              enrollmentDate
            }
            : c
        ));
      }
    }
  }, [allCourses]);

  // NEW: Remove enrollment function
  const removeEnrollment = useCallback((courseId: string) => {
    // Remove from enrollments
    setUserEnrollments(prev => {
      const newEnrollments = { ...prev };
      delete newEnrollments[courseId];
      return newEnrollments;
    });

    // Remove from progress
    setUserProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[courseId];
      return newProgress;
    });

    // Update course student count (decrement)
    const course = allCourses.find(c => c.id === courseId);
    if (course) {
      const baseCourse = baseCourses.find(c => c.id === courseId);
      if (baseCourse) {
        setEditedCourses(prev => ({
          ...prev,
          [courseId]: {
            ...baseCourse,
            ...prev[courseId],
            students: Math.max(0, (prev[courseId]?.students || baseCourse.students || 0) - 1),
            isEnrolled: false,
            enrollmentDate: undefined
          }
        }));
      } else {
        setCreatedCourses(prev => prev.map(c =>
          c.id === courseId
            ? {
              ...c,
              students: Math.max(0, (c.students || 0) - 1),
              isEnrolled: false,
              enrollmentDate: undefined
            }
            : c
        ));
      }
    }
  }, [allCourses]);

  const isEnrolled = useCallback((courseId: string) => {
    return Boolean(userEnrollments[courseId]);
  }, [userEnrollments]);

  const getUserEnrolledCourses = useCallback(() => {
    return allCourses.filter(course => userEnrollments[course.id]);
  }, [allCourses, userEnrollments]);

  const getEnrollmentDate = useCallback((courseId: string) => {
    return userEnrollments[courseId]?.date || null;
  }, [userEnrollments]);

  // =============== REVIEW FUNCTIONS ===============
  const submitReview = useCallback((courseId: string, rating: number, comment: string) => {
    const userName = profile?.name || 'Anonymous Student';
    const reviewDate = new Date().toISOString().split('T')[0];

    // Store user's review
    const userReview: UserReview = {
      rating,
      comment,
      date: reviewDate,
      courseId
    };

    setUserReviews(prev => ({
      ...prev,
      [courseId]: userReview
    }));

    // Create review object for course
    const newReview: Review = {
      id: `user_${Date.now()}_${courseId}`,
      student: userName,
      rating,
      comment,
      date: reviewDate,
      userId: profile?.id
    };

    // Update course reviews and rating
    const course = allCourses.find(c => c.id === courseId);
    if (course) {
      const newReviews = [...course.reviews, newReview];
      const newRating = newReviews.reduce((sum, r) => sum + r.rating, 0) / newReviews.length;

      const baseCourse = baseCourses.find(c => c.id === courseId);
      if (baseCourse) {
        setEditedCourses(prev => ({
          ...prev,
          [courseId]: {
            ...baseCourse,
            ...prev[courseId],
            reviews: newReviews,
            rating: parseFloat(newRating.toFixed(1)),
            reviewCount: newReviews.length
          }
        }));
      } else {
        setCreatedCourses(prev => prev.map(c =>
          c.id === courseId
            ? {
              ...c,
              reviews: newReviews,
              rating: parseFloat(newRating.toFixed(1)),
              reviewCount: newReviews.length
            }
            : c
        ));
      }
    }
  }, [allCourses, profile]);

  const updateReview = useCallback((courseId: string, rating: number, comment: string) => {
    const existingReview = userReviews[courseId];
    if (!existingReview) return;

    const userName = profile?.name || 'Anonymous Student';
    const reviewDate = new Date().toISOString().split('T')[0];

    // Update user's review
    const updatedUserReview: UserReview = {
      rating,
      comment,
      date: reviewDate,
      courseId
    };

    setUserReviews(prev => ({
      ...prev,
      [courseId]: updatedUserReview
    }));

    // Find and update in course reviews
    const course = allCourses.find(c => c.id === courseId);
    if (course) {
      const updatedReviews = course.reviews.map(review =>
        (review.id.startsWith('user_') && 'userId' in review && review.userId === profile?.id) ? {
          ...review,
          student: userName,
          rating,
          comment,
          date: reviewDate,
          userId: profile?.id
        }
          : review
      );

      const newRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;

      // Update course
      const baseCourse = baseCourses.find(c => c.id === courseId);
      if (baseCourse) {
        setEditedCourses(prev => ({
          ...prev,
          [courseId]: {
            ...baseCourse,
            ...prev[courseId],
            reviews: updatedReviews,
            rating: parseFloat(newRating.toFixed(1)),
            reviewCount: updatedReviews.length
          }
        }));
      } else {
        setCreatedCourses(prev => prev.map(c =>
          c.id === courseId
            ? {
              ...c,
              reviews: updatedReviews,
              rating: parseFloat(newRating.toFixed(1)),
              reviewCount: updatedReviews.length
            }
            : c
        ));
      }
    }
  }, [allCourses, profile, userReviews]);

  const removeReview = useCallback((courseId: string) => {
    // Remove from user reviews
    setUserReviews(prev => {
      const newReviews = { ...prev };
      delete newReviews[courseId];
      return newReviews;
    });

    // Remove from course reviews
    const course = allCourses.find(c => c.id === courseId);
    if (course) {
      const updatedReviews = course.reviews.filter(review =>
        !(review.id.startsWith('user_') && 'userId' in review && review.userId === profile?.id));

      const newRating = updatedReviews.length > 0
        ? updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length
        : 0;

      // Update course
      const baseCourse = baseCourses.find(c => c.id === courseId);
      if (baseCourse) {
        setEditedCourses(prev => ({
          ...prev,
          [courseId]: {
            ...baseCourse,
            ...prev[courseId],
            reviews: updatedReviews,
            rating: parseFloat(newRating.toFixed(1)),
            reviewCount: updatedReviews.length
          }
        }));
      } else {
        setCreatedCourses(prev => prev.map(c =>
          c.id === courseId
            ? {
              ...c,
              reviews: updatedReviews,
              rating: parseFloat(newRating.toFixed(1)),
              reviewCount: updatedReviews.length
            }
            : c
        ));
      }
    }
  }, [allCourses, profile]);

  const hasUserReviewed = useCallback((courseId: string) => {
    return Boolean(userReviews[courseId]);
  }, [userReviews]);

  const getUserReview = useCallback((courseId: string) => {
    const reviewData = userReviews[courseId];
    if (!reviewData) return null;

    return {
      id: `user_${courseId}`,
      student: profile?.name || 'You',
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: reviewData.date,
      userId: profile?.id
    } as Review;
  }, [userReviews, profile]);

  // =============== PROGRESS FUNCTIONS ===============
  const updateCourseProgress = useCallback((courseId: string, progress: number, completedLessons: number) => {
    setUserProgress(prev => ({
      ...prev,
      [courseId]: {
        progress: Math.min(100, Math.max(0, progress)),
        completedLessons
      }
    }));

    // Also update in enrollments if enrolled
    if (userEnrollments[courseId]) {
      setUserEnrollments(prev => ({
        ...prev,
        [courseId]: {
          ...prev[courseId],
          progress: Math.min(100, Math.max(0, progress)),
          completedLessons
        }
      }));
    }
  }, [userEnrollments]);

  // =============== ASSIGNMENT FUNCTIONS ===============
  const submitAssignment = useCallback((courseId: string, assignmentId: string, submission: { fileUrl?: string; text?: string }) => {
    if (!profile?.id) return;

    const submissionId = `submission_${Date.now()}`;
    const submittedAt = new Date().toISOString();

    const newSubmission: AssignmentSubmission = {
      id: submissionId,
      assignmentId,
      courseId,
      userId: profile.id,
      studentName: profile.name || 'Student',
      submittedAt,
      fileUrl: submission.fileUrl,
      text: submission.text,
      status: 'submitted',
      grade: undefined,
      feedback: undefined,
      attachments: submission.fileUrl ? [{ // ADDED: attachments field
        name: 'submission',
        type: 'file',
        dataUrl: submission.fileUrl
      }] : undefined
    };

    // Generate a unique key for storage
    const storageKey = `${profile.id}_${courseId}_${assignmentId}`;

    setAssignmentSubmissions(prev => ({
      ...prev,
      [storageKey]: newSubmission
    }));
  }, [profile]);

  const getAssignmentSubmission = useCallback((courseId: string, assignmentId: string) => {
    if (!profile?.id) return null;

    const storageKey = `${profile.id}_${courseId}_${assignmentId}`;
    return assignmentSubmissions[storageKey] || null;
  }, [profile, assignmentSubmissions]);

  const gradeAssignment = useCallback((courseId: string, assignmentId: string, grade: number, feedback: string) => {
    if (!profile?.id) return;

    const storageKey = `${profile.id}_${courseId}_${assignmentId}`;
    const existingSubmission = assignmentSubmissions[storageKey];

    if (existingSubmission) {
      setAssignmentSubmissions(prev => ({
        ...prev,
        [storageKey]: {
          ...existingSubmission,
          grade,
          feedback,
          status: 'graded'
        }
      }));
    }
  }, [profile, assignmentSubmissions]);

  // =============== CONTEXT VALUE ===============
  const value = useMemo<CoursesContextValue>(
    () => ({
      allCourses,
      publicCourses,
      createdCourses,
      addCourse,
      updateCourse,
      // Enrollment functions
      enrollInCourse,
      removeEnrollment,
      isEnrolled,
      getUserEnrolledCourses,
      getEnrollmentDate,
      // Review functions
      submitReview,
      updateReview,
      removeReview,
      hasUserReviewed,
      getUserReview,
      // Progress function
      updateCourseProgress,
      // Assignment functions
      submitAssignment,
      getAssignmentSubmission,
      gradeAssignment
    }),
    [
      allCourses,
      publicCourses,
      createdCourses,
      addCourse,
      updateCourse,
      enrollInCourse,
      removeEnrollment,
      isEnrolled,
      getUserEnrolledCourses,
      getEnrollmentDate,
      submitReview,
      updateReview,
      removeReview,
      hasUserReviewed,
      getUserReview,
      updateCourseProgress,
      submitAssignment,
      getAssignmentSubmission,
      gradeAssignment
    ]
  );

  return <CoursesContext.Provider value={value}>{children}</CoursesContext.Provider>;
}

// =============== HOOK ===============
export function useCourses() {
  const context = useContext(CoursesContext);
  if (!context) {
    throw new Error('useCourses must be used within a CoursesProvider');
  }
  return context;
}