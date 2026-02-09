// app/types/index.ts

// ===================== CATEGORY TYPES =====================
export interface Category {
    id: string;
    name: string;
    icon: string;
}

// ===================== COURSE TYPES =====================
export interface Instructor {
    name: string;
    bio: string;
    avatar: string;
}

export interface Review {
    id: string;
    student: string;
    rating: number;
    comment: string;
    date: string;
    userId?: string; // Add userId to track who submitted the review
}

export interface LessonAttachment {
    name: string;
    type: string; // Note: This field exists in CoursesContext
    dataUrl: string;
}

export type LessonItem = string | {
    title: string;
    files?: LessonAttachment[]
};

export interface SyllabusSection {
    id: string;
    title: string;
    lessons: LessonItem[]; // Array of LessonItem (which can be string OR object)
}

// MATCH CoursesContext.tsx with additional fields:
export interface Course {
    id: string;
    title: string;
    description: string;
    category: string;
    categoryId: string;
    instructor: Instructor;
    rating: number;
    reviewCount: number;
    students: number;
    level: string;
    duration: string;
    image?: string;
    syllabus: SyllabusSection[];
    reviews: Review[];
    learningOutcomes?: string[];
    isPublished?: boolean;
    // Add enrollment tracking
    isEnrolled?: boolean;
    enrollmentDate?: string;
    userProgress?: number; // 0-100%
    userCompletedLessons?: number;
}

// ===================== ENROLLMENT TYPES =====================
export interface EnrolledCourseData {
  courseId: string;
  progress: number; // This should be userProgress to match Course
  lastAccessed: string;
  completedLessons: number; // This should be userCompletedLessons to match Course
  totalLessons: number;
  enrollmentDate: string;
}

// FIX: Use Omit to remove the optional fields from Course before extending
export type EnrolledCourse = Omit<Course, 'enrollmentDate' | 'userProgress' | 'userCompletedLessons'> & {
  enrollmentDate: string;
  userProgress: number;
  userCompletedLessons: number;
  lastAccessed: string;
  totalLessons: number;
};

// ===================== DASHBOARD TYPES =====================
export interface Achievement {
    id: string;
    title: string;
    icon: string;
    date: string;
}

export interface StudentStats {
    coursesEnrolled: number;
    coursesCompleted: number;
    certificatesEarned: number;
    hoursLearned: number;
}

export interface TeacherStats {
    totalStudents: number;
    activeCourses: number;
    averageRating: number;
    totalRevenue: number;
}

export interface AdminStats {
    totalUsers: number;
    totalCourses: number;
    activeCourses: number;
    newUsersThisMonth: number;
}

export interface Stats {
    student: StudentStats;
    teacher: TeacherStats;
    admin: AdminStats;
}

// ===================== USER/PROFILE TYPES =====================
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  professionalism: string;
  rating?: number;
  graduationYear?: string;
  expertise?: string;
  experienceYears?: string;
  role?: 'student' | 'teacher' | 'admin';
  enrolledCourses?: string[]; // Array of course IDs
  reviews?: string[]; // Array of review IDs
}

// ===================== REVIEW SUBMISSION TYPES =====================
export interface ReviewSubmission {
  rating: number;
  comment: string;
  courseId: string;
  userId?: string;
}