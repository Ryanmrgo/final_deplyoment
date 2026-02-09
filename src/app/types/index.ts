// app/types/index.ts

// ===================== CATEGORY TYPES =====================
export interface Category {
  id: string;
  name: string;
  icon: string;
}


// ===================== COURSE TYPES =====================
export interface LessonFile {
  name: string;
  dataUrl: string;
}

export interface LessonItem {
  title: string;
  files?: LessonFile[];
}

export interface SyllabusSection {
  id: string;
  title: string;
  lessons: (string | LessonItem)[]; // Can be string OR object
}

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
}

// Keep all other interfaces the same...
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
}

// ===================== ENROLLMENT TYPES =====================
export interface EnrolledCourseData {
  courseId: string;
  progress: number;
  lastAccessed: string;
  completedLessons: number;
  totalLessons: number;
}

export interface EnrolledCourse extends Course, EnrolledCourseData {}

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
}