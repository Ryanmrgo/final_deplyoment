import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true }, // Clerk user ID
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'quiz', required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'course', required: true },
    answers: [
      {
        questionIndex: { type: Number, required: true },
        answer: { type: String, default: '' },
        isCorrect: { type: Boolean, default: false },
        pointsEarned: { type: Number, default: 0 },
      },
    ],
    score: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    timeSpent: { type: Number, default: 0 }, // seconds
    submittedAt: { type: Date, default: Date.now },
    attemptNumber: { type: Number, default: 1 },
  },
  { minimize: false }
);

quizAttemptSchema.index({ studentId: 1, quizId: 1, attemptNumber: 1 });

const QuizAttempt = mongoose.models.quizattempt || mongoose.model('quizattempt', quizAttemptSchema);

export default QuizAttempt;
