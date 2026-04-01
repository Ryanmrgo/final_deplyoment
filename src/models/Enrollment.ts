import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true }, // Clerk user ID
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'course', required: true },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    progress: { type: Number, default: 0, min: 0, max: 100 }, // percentage
    completedLessonIds: [{ type: String }], // completed lesson IDs
    status: { type: String, enum: ['Active', 'Completed', 'Dropped'], default: 'Active' },
    lastAccessedAt: { type: Date, default: Date.now },
    certificate: {
      issued: { type: Boolean, default: false },
      issuedAt: { type: Date, default: null },
      certificateUrl: { type: String, default: '' },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

// Unique constraint: one student can only enroll once per course
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

const Enrollment = mongoose.models.enrollment || mongoose.model('enrollment', enrollmentSchema);

export default Enrollment;
