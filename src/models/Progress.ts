import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true }, // Clerk user ID
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'course', required: true },
    lessonId: { type: String, default: '' }, // or can be ObjectId depending on lesson structure
    completedAt: { type: Date, default: null },
    isCompleted: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 }, // in minutes
    notes: { type: String, default: '' },
    lastViewedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

// Unique constraint: one student can only have one progress record per lesson
progressSchema.index({ studentId: 1, courseId: 1, lessonId: 1 }, { unique: true });

const Progress = mongoose.models.progress || mongoose.model('progress', progressSchema);

export default Progress;
