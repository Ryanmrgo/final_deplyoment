// app/types/index.ts

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
