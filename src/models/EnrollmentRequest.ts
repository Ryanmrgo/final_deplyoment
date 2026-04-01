import mongoose, { HydratedDocument, Model, Schema } from 'mongoose';

export type EnrollmentRequestStatus = 'pending' | 'approved' | 'rejected';

export interface EnrollmentRequest {
  studentId: string;
  courseId: mongoose.Types.ObjectId;
  fullName: string;
  age: number;
  educationalBackground: string;
  reasonForJoining: string;
  status: EnrollmentRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type EnrollmentRequestDocument = HydratedDocument<EnrollmentRequest>;
type EnrollmentRequestModel = Model<EnrollmentRequest>;

const enrollmentRequestSchema = new Schema<EnrollmentRequest, EnrollmentRequestModel>(
  {
    studentId: { type: String, ref: 'user', required: true },
    courseId: { type: Schema.Types.ObjectId, ref: 'course', required: true },
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 1 },
    educationalBackground: { type: String, required: true, trim: true },
    reasonForJoining: { type: String, required: true, trim: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  },
  { timestamps: true, minimize: false }
);

enrollmentRequestSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const EnrollmentRequestModelRef =
  (mongoose.models.enrollmentrequest as EnrollmentRequestModel | undefined) ||
  mongoose.model<EnrollmentRequest, EnrollmentRequestModel>('enrollmentrequest', enrollmentRequestSchema);

export default EnrollmentRequestModelRef;
