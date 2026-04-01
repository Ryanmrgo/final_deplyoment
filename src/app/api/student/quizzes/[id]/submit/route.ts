import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Quiz from '@/models/Quiz';
import QuizAttempt from '@/models/QuizAttempt';
import Enrollment from '@/models/Enrollment';
import mongoose from 'mongoose';
import { getEffectiveRole } from '@/lib/auth';
import { createNotification } from '@/lib/notifications';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'student') return NextResponse.json({ error: 'Student required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 });

    const body = await req.json();
    const { answers, timeSpent } = body; // answers: [{ questionIndex, answer }]

    await connectDB();
    const quiz = await Quiz.findById(id).lean();
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    if (!(quiz as any).isPublished) {
      return NextResponse.json({ error: 'Quiz is not published yet' }, { status: 403 });
    }

    const enrollment = await Enrollment.findOne({ courseId: (quiz as any).courseId, studentId: userId });
    if (!enrollment) return NextResponse.json({ error: 'Enroll in course first' }, { status: 403 });

    const questions = (quiz as any).questions || [];
    const answerMap = Object.fromEntries((answers || []).map((a: any) => [a.questionIndex, a.answer]));

    let totalEarned = 0;
    const evaluatedAnswers = questions.map((q: any, idx: number) => {
      const userAnswerRaw = String(answerMap[idx] ?? '').trim();
      const userAnswer = userAnswerRaw.toLowerCase();
      const correctAnswerRaw = String(q.correctAnswer ?? '').trim();
      const correctAnswer = correctAnswerRaw.toLowerCase();
      const points = q.points ?? 1;
      let isCorrect = false;
      if (q.type === 'multiple-choice') {
        const optionIndex = Array.isArray(q.options)
          ? q.options.findIndex((option: string) => String(option).trim().toLowerCase() === correctAnswer)
          : -1;
        isCorrect = userAnswer === correctAnswer || userAnswer === String(optionIndex);
      } else {
        isCorrect = userAnswer === correctAnswer;
      }
      if (!isCorrect && (q.options || []).some((o: string) => String(o).toLowerCase() === userAnswer)) {
        isCorrect = String(q.correctAnswer).toLowerCase() === userAnswer;
      }
      const earned = isCorrect ? points : 0;
      totalEarned += earned;
      return { questionIndex: idx, answer: userAnswerRaw, isCorrect, pointsEarned: earned };
    });

    const totalPoints = questions.reduce((s: number, q: any) => s + (q.points ?? 1), 0);
    const percentage = totalPoints > 0 ? Math.round((totalEarned / totalPoints) * 100) : 0;
    const passingScore = (quiz as any).passingScore ?? 70;
    const passed = percentage >= passingScore;

    const attemptCount = await QuizAttempt.countDocuments({ studentId: userId, quizId: id });
    const maxAttempts = Math.max(1, Number((quiz as any).attempts ?? 1));
    if (attemptCount >= maxAttempts) {
      return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 400 });
    }

    const attempt = new QuizAttempt({
      studentId: userId,
      quizId: id,
      courseId: (quiz as any).courseId,
      answers: evaluatedAnswers,
      score: totalEarned,
      maxScore: totalPoints,
      percentage,
      passed,
      timeSpent: timeSpent ?? 0,
      attemptNumber: attemptCount + 1,
    });
    await attempt.save();

    const remainingAttempts = Math.max(0, maxAttempts - (attemptCount + 1));

    try {
      await createNotification({
        recipientId: String((quiz as any).instructorId),
        recipientRole: 'teacher',
        type: 'quiz.submitted',
        title: 'New quiz submission',
        message: `A student submitted "${String((quiz as any).title || 'quiz')}".`,
        entityType: 'quiz',
        entityId: String((quiz as any)._id),
        actionUrl: `/dashboard/teacher/course/${String((quiz as any).courseId)}#quizzes`,
        priority: 'medium',
        metadata: {
          quizId: String((quiz as any)._id),
          attemptId: String(attempt._id),
          studentId: userId,
        },
      });

      await createNotification({
        recipientId: userId,
        recipientRole: 'student',
        type: 'quiz.submitted',
        title: 'Quiz submitted successfully',
        message: `Your attempt for "${String((quiz as any).title || 'quiz')}" has been recorded.`,
        entityType: 'quiz',
        entityId: String((quiz as any)._id),
        actionUrl: `/courses/${String((quiz as any).courseId)}`,
        priority: 'low',
        metadata: {
          quizId: String((quiz as any)._id),
          attemptId: String(attempt._id),
          score: totalEarned,
          maxScore: totalPoints,
        },
      });
    } catch (notificationError) {
      console.error('Quiz notification error:', notificationError);
    }

    return NextResponse.json({
      success: true,
      attempt: {
        attemptId: String(attempt._id),
        attemptNumber: attemptCount + 1,
        score: totalEarned,
        maxScore: totalPoints,
        percentage,
        passed,
        answers: evaluatedAnswers,
      },
      maxAttempts,
      remainingAttempts,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
