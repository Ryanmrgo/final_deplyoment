import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
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

const Lesson = mongoose.models.lesson || mongoose.model('lesson', lessonSchema);

export default Lesson;
