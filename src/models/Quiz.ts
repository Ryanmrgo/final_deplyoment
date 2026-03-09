import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'course', required: true },
    instructorId: { type: String, required: true }, // Clerk user ID
    questions: [
      {
        questionText: String,
        type: { type: String, enum: ['multiple-choice', 'fill-in-the-blank', 'short-answer', 'true-false'], default: 'multiple-choice' },
        options: [String], // for multiple choice
        correctAnswer: String, // index or text
        points: { type: Number, default: 1 },
      },
    ],
    totalPoints: { type: Number, default: 0 },
    passingScore: { type: Number, default: 70 }, // percentage
    timeLimit: { type: Number, default: 0 }, // in minutes, 0 = no limit
    isPublished: { type: Boolean, default: false },
    showAnswersAfterSubmit: { type: Boolean, default: true },
    attempts: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { minimize: false }
);

const Quiz = mongoose.models.quiz || mongoose.model('quiz', quizSchema);

export default Quiz;
