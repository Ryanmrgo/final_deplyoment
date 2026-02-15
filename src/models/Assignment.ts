import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'course', required: true },
    instructorId: { type: String, required: true }, // Clerk user ID
    dueDate: { type: Date, required: true },
    maxPoints: { type: Number, default: 100 },
    instructions: { type: String, default: '' },
    attachments: [{ type: String }], // URLs to attached files
    isPublished: { type: Boolean, default: false },
    allowLateSubmission: { type: Boolean, default: true },
    latePenalty: { type: Number, default: 0 }, // percentage
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

const Assignment = mongoose.models.assignment || mongoose.model('assignment', assignmentSchema);

export default Assignment;
