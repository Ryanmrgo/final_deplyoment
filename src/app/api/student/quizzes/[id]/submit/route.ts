import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Quiz from '@/models/Quiz';
import QuizAttempt from '@/models/QuizAttempt';
import Enrollment from '@/models/Enrollment';
import mongoose from 'mongoose';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const role = (sessionClaims?.publicMetadata as any)?.role;
  if (role !== 'student') return NextResponse.json({ error: 'Student required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 });

    const body = await req.json();
    const { answers, timeSpent } = body; // answers: [{ questionIndex, answer }]

    await connectDB();
    const quiz = await Quiz.findById(id).lean();
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    const enrollment = await Enrollment.findOne({ courseId: (quiz as any).courseId, studentId: userId });
    if (!enrollment) return NextResponse.json({ error: 'Enroll in course first' }, { status: 403 });

    const questions = (quiz as any).questions || [];
    const answerMap = Object.fromEntries((answers || []).map((a: any) => [a.questionIndex, a.answer]));

    let totalEarned = 0;
    const evaluatedAnswers = questions.map((q: any, idx: number) => {
      const userAnswer = String(answerMap[idx] ?? '').trim().toLowerCase();
      const correctAnswer = String(q.correctAnswer ?? '').trim().toLowerCase();
      const points = q.points ?? 1;
      let isCorrect = false;
      if (q.type === 'multiple-choice') {
        isCorrect = userAnswer === correctAnswer || userAnswer === String(q.options?.indexOf?.(q.correctAnswer) ?? -1);
      } else {
        isCorrect = userAnswer === correctAnswer;
      }
      if (!isCorrect && (q.options || []).some((o: string) => String(o).toLowerCase() === userAnswer)) {
        isCorrect = String(q.correctAnswer).toLowerCase() === userAnswer;
      }
      const earned = isCorrect ? points : 0;
      totalEarned += earned;
      return { questionIndex: idx, answer: userAnswer, isCorrect, pointsEarned: earned };
    });

    const totalPoints = questions.reduce((s: number, q: any) => s + (q.points ?? 1), 0);
    const percentage = totalPoints > 0 ? Math.round((totalEarned / totalPoints) * 100) : 0;
    const passingScore = (quiz as any).passingScore ?? 70;
    const passed = percentage >= passingScore;

    const attemptCount = await QuizAttempt.countDocuments({ studentId: userId, quizId: id });

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

    return NextResponse.json({
      success: true,
      attempt: {
        score: totalEarned,
        maxScore: totalPoints,
        percentage,
        passed,
        answers: evaluatedAnswers,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
  }
}
