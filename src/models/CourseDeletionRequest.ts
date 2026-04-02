import mongoose, { HydratedDocument, Model, Schema } from 'mongoose';

export type CourseDeletionRequestStatus = 'pending' | 'approved' | 'rejected';

export interface CourseDeletionRequest {
  teacherId: string;
  courseId: mongoose.Types.ObjectId;
  courseTitle: string;
  status: CourseDeletionRequestStatus;
  teacherMessage: string;
  adminNote: string;
  reviewedBy: string;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CourseDeletionRequestDocument = HydratedDocument<CourseDeletionRequest>;
type CourseDeletionRequestModel = Model<CourseDeletionRequest>;

const courseDeletionRequestSchema = new Schema<CourseDeletionRequest, CourseDeletionRequestModel>(
  {
    teacherId: { type: String, required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'course', required: true, index: true },
    courseTitle: { type: String, required: true, trim: true, maxlength: 200, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    teacherMessage: { type: String, default: '', trim: true, maxlength: 500 },
    adminNote: { type: String, default: '', trim: true, maxlength: 500 },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true, minimize: false }
);

courseDeletionRequestSchema.index(
  { courseId: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

const CourseDeletionRequestModelRef =
  (mongoose.models.coursedeletionrequest as CourseDeletionRequestModel | undefined) ||
  mongoose.model<CourseDeletionRequest, CourseDeletionRequestModel>(
    'coursedeletionrequest',
    courseDeletionRequestSchema
  );

export default CourseDeletionRequestModelRef;
