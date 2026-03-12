import mongoose, { HydratedDocument, Model, Schema } from 'mongoose';

export type LessonType = 'video' | 'pdf' | 'ppt' | 'text';

export interface Lesson {
  courseId: mongoose.Types.ObjectId;
  sectionTitle: string;
  title: string;
  description: string;
  type: LessonType;
  content: string;
  fileUrl: string;
  order: number;
  duration: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type LessonDocument = HydratedDocument<Lesson>;
type LessonModel = Model<Lesson>;

const lessonSchema = new Schema<Lesson, LessonModel>(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'course', required: true },
    sectionTitle: { type: String, default: '' }, // e.g. "Module 1: Introduction"
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['video', 'pdf', 'ppt', 'text'], default: 'text' },
    content: { type: String, default: '' }, // text content or embed URL
    fileUrl: { type: String, default: '' }, // Cloudinary/Drive URL for PDF, PPT, video
    order: { type: Number, default: 0 }, // order within course
    duration: { type: Number, default: 0 }, // minutes
    isPublished: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

lessonSchema.index({ courseId: 1, order: 1 });

const Lesson =
  (mongoose.models.lesson as LessonModel | undefined) ||
  mongoose.model<Lesson, LessonModel>('lesson', lessonSchema);

export default Lesson;
