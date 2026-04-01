import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true }, // Clerk user ID
    assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'assignment', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'course', required: true },
    content: { type: String, default: '' }, // submission text or URL
    attachments: [{ type: mongoose.Schema.Types.Mixed }], // FileAsset[] (backward compatible with string URLs)
    submittedAt: { type: Date, required: true },
    isLate: { type: Boolean, default: false },
    status: { type: String, enum: ['Submitted', 'Graded', 'Returned'], default: 'Submitted' },
    grade: {
      points: { type: Number, default: 0 },
      maxPoints: { type: Number, default: 0 },
      percentage: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      gradedAt: { type: Date, default: null },
      gradedBy: { type: String, default: '' }, // Clerk user ID of grader
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

// Unique constraint: one student can only submit once per assignment
submissionSchema.index({ studentId: 1, assignmentId: 1 }, { unique: true });

const Submission = mongoose.models.submission || mongoose.model('submission', submissionSchema);

export default Submission;
