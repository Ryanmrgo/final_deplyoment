import mongoose, { HydratedDocument, Model, Schema } from 'mongoose';

export type LessonType = 'video' | 'pdf' | 'ppt' | 'text';
export type LessonContentType = 'video' | 'youtube' | 'document';
export type LessonVideoType = 'upload' | 'youtube';

export interface LessonVideo {
  type: LessonVideoType;
  url: string;
}

export interface LessonFile {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface Lesson {
  courseId: mongoose.Types.ObjectId;
  sectionTitle: string;
  title: string;
  description: string;
  video?: LessonVideo | null;
  files?: LessonFile[];
  contentType: LessonContentType;
  type: LessonType;
  content: string;
  fileUrl: string;
  youtubeUrl: string;
  fileType: string;
  lessonOrder: number;
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
    video: {
      type: {
        type: String,
        enum: ['upload', 'youtube'],
        default: undefined,
      },
      url: { type: String, default: '' },
    },
    files: {
      type: [
        {
          fileName: { type: String, default: '' },
          fileUrl: { type: String, default: '' },
          fileType: { type: String, default: '' },
        },
      ],
      default: [],
    },
    contentType: { type: String, enum: ['video', 'youtube', 'document'], default: 'document' },
    type: { type: String, enum: ['video', 'pdf', 'ppt', 'text'], default: 'text' },
    content: { type: String, default: '' }, // text content or embed URL
    fileUrl: { type: String, default: '' }, // Cloudinary/Drive URL for PDF, PPT, video
    youtubeUrl: { type: String, default: '' },
    fileType: { type: String, default: '' },
    lessonOrder: { type: Number, default: 0 },
    order: { type: Number, default: 0 }, // order within course
    duration: { type: Number, default: 0 }, // minutes
    isPublished: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, lessonOrder: 1 });

const Lesson =
  (mongoose.models.lesson as LessonModel | undefined) ||
  mongoose.model<Lesson, LessonModel>('lesson', lessonSchema);

export default Lesson;
