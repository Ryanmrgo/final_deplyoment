import mongoose, { HydratedDocument, Model, Schema } from 'mongoose';

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type CourseStatus = 'Draft' | 'Published' | 'Archived';

export interface CourseReview {
  studentId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface CourseSyllabusMaterial {
  label: string;
  url: string;
  name: string;
  type: string;
}

export interface Course {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: CourseLevel;
  duration: number;
  image: string;
  syllabusUrl: string;
  syllabusName: string;
  syllabusType: string;
  syllabusMaterials: CourseSyllabusMaterial[];
  language: string;
  requirements: string;
  outcomes: string;
  price: number;
  startDate: Date;
  endDate: Date | null;
  status: CourseStatus;
  students: string[];
  totalStudents: number;
  rating: number;
  reviews: CourseReview[];
  createdAt: Date;
  updatedAt: Date;
}

export type CourseDocument = HydratedDocument<Course>;
type CourseModel = Model<Course>;

const courseSchema = new Schema<Course, CourseModel>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    instructor: { type: String, required: true }, // Clerk user ID of teacher
    category: { type: String, default: 'General' },
    level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    duration: { type: Number, default: 0 }, // in hours
    image: { type: String, default: '' }, // Cloudinary URL
    syllabusUrl: { type: String, default: '' },
    syllabusName: { type: String, default: '' },
    syllabusType: { type: String, default: '' },
    syllabusMaterials: {
      type: [
        {
          label: { type: String, default: '' },
          url: { type: String, default: '' },
          name: { type: String, default: '' },
          type: { type: String, default: '' },
        },
      ],
      default: [],
    },
    language: { type: String, default: 'English' },
    requirements: { type: String, default: '' },
    outcomes: { type: String, default: '' },
    price: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, default: null },
    status: { type: String, enum: ['Draft', 'Published', 'Archived'], default: 'Draft' },
    students: [{ type: String }], // Array of Clerk user IDs
    totalStudents: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: [
      {
        studentId: String,
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

const Course =
  (mongoose.models.course as CourseModel | undefined) ||
  mongoose.model<Course, CourseModel>('course', courseSchema);

export default Course;
