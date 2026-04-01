"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';

interface QuizTakeProps {
  courseId: string;
  quizId: string;
}

export function QuizTake({ courseId, quizId }: QuizTakeProps) {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [attemptSummary, setAttemptSummary] = useState<{ maxAttempts: number; usedAttempts: number; remainingAttempts: number } | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<any[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(true);

  const getQuestionLabel = (index: number) => String.fromCharCode(65 + index);

  useEffect(() => {
    Promise.all([
      fetch(`/api/student/quizzes/${quizId}`).then((r) => r.json()),
      fetch(`/api/student/quizzes/${quizId}/attempts`).then((r) => r.json()).catch(() => null),
    ])
      .then(([quizData, attemptData]) => {
        setQuiz(quizData);
        setAttemptHistory(Array.isArray(attemptData?.items) ? attemptData.items : []);
        if (attemptData?.summary) {
          setAttemptSummary({
            maxAttempts: Number(attemptData.summary.maxAttempts || 1),
            usedAttempts: Number(attemptData.summary.usedAttempts || 0),
            remainingAttempts: Number(attemptData.summary.remainingAttempts || 0),
          });
        }
      })
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [quizId]);

  useEffect(() => {
    if (user === null || userRole !== 'student') {
      router.push('/auth/sign-in');
    }
  }, [user, userRole, router]);

  const handleSubmit = async () => {
    setSubmitError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/student/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([idx, answer]) => ({
            questionIndex: parseInt(idx, 10),
            answer,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.error || 'Failed to submit quiz.');
        return;
      }
      setResult(data.attempt);
      setAttemptHistory((prev) => [
        {
          id: String(data.attempt?.attemptId || ''),
          attemptNumber: Number(data.attempt?.attemptNumber || (prev.length + 1)),
          score: Number(data.attempt?.score || 0),
          maxScore: Number(data.attempt?.maxScore || 0),
          percentage: Number(data.attempt?.percentage || 0),
          passed: Boolean(data.attempt?.passed),
          submittedAt: new Date().toISOString(),
          teacherRemark: '',
          reviewedAt: null,
        },
        ...prev,
      ]);
      setAttemptSummary((prev) => ({
        maxAttempts: Number(data.maxAttempts ?? prev?.maxAttempts ?? 1),
        usedAttempts: Number((prev?.usedAttempts ?? 0) + 1),
        remainingAttempts: Number(data.remainingAttempts ?? Math.max(0, (prev?.remainingAttempts ?? 0) - 1)),
      }));
    } finally {
      setSubmitting(false);
    }
  };

  if (user === null || userRole !== 'student') {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]" />
      </div>
    );
  }

  if (!quiz || quiz.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Quiz not found or not accessible.</p>
          <Link href={`/courses/${courseId}`}>
            <Button>Back to Course</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] py-12">
        <div className="container max-w-2xl mx-auto px-4">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="text-center">
                {result.passed ? (
                  <span className="text-green-600 flex items-center justify-center gap-2">
                    <CheckCircle className="w-8 h-8" /> Passed!
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center justify-center gap-2">
                    <XCircle className="w-8 h-8" /> Not Passed
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-2xl font-bold">
                Score: {result.score} / {result.maxScore} ({result.percentage}%)
              </p>
              <p className="text-center text-gray-600">
                Passing score: {quiz.passingScore}%
              </p>
              {attemptSummary ? (
                <p className="text-center text-sm text-gray-600">
                  Attempt {result.attemptNumber} / {attemptSummary.maxAttempts} • Remaining {attemptSummary.remainingAttempts}
                </p>
              ) : null}
              {result.passed && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-sm text-green-700">
                    ✓ Quiz submitted successfully.
                  </p>
                </div>
              )}
              <div className="flex justify-center gap-4 pt-4">
                <Link href={`/courses/${courseId}`}>
                  <Button className="bg-[#1E3A8A]">Back to Course</Button>
                </Link>
                <Button
                  variant="outline"
                  disabled={(attemptSummary?.remainingAttempts ?? 0) <= 0}
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                  }}
                >
                  Retake Quiz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const questions = quiz.questions || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12">
      <div className="container max-w-2xl mx-auto px-4">
        <Link href={`/courses/${courseId}`} className="inline-flex items-center text-[#1E3A8A] hover:underline mb-6">
          <ChevronLeft className="w-5 h-5 mr-1" />
          Back to Course
        </Link>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            {quiz.description && <p className="text-gray-600">{quiz.description}</p>}
            <p className="text-sm text-gray-500">{questions.length} questions • {quiz.totalPoints} points</p>
          </CardHeader>
          <CardContent className="space-y-8">
            {attemptSummary ? (
              <p className="text-sm text-gray-600">
                Attempts: {attemptSummary.usedAttempts}/{attemptSummary.maxAttempts} • Remaining:{' '}
                {attemptSummary.remainingAttempts}
              </p>
            ) : null}
            {attemptHistory.length > 0 ? (
              <div className="rounded-lg border p-3 bg-gray-50 space-y-3">
                <p className="text-sm font-semibold text-gray-900">Previous Attempts & Remarks</p>
                {attemptHistory.slice(0, 5).map((item) => (
                  <div key={item.id || `${item.attemptNumber}-${item.submittedAt}`} className="rounded border bg-white p-3">
                    <p className="text-sm font-medium text-gray-900">
                      Attempt #{item.attemptNumber}: {item.score}/{item.maxScore} ({item.percentage}%)
                    </p>
                    <p className="text-xs text-gray-600">
                      {item.passed ? 'Passed' : 'Not passed'} • Submitted {new Date(item.submittedAt).toLocaleString()}
                    </p>
                    {item.teacherRemark ? (
                      <div className="mt-2 rounded bg-blue-50 border border-blue-200 p-2">
                        <p className="text-xs font-semibold text-blue-900">Teacher Remark</p>
                        <p className="text-sm text-blue-900 whitespace-pre-wrap">{item.teacherRemark}</p>
                        {item.reviewedAt ? (
                          <p className="text-[11px] text-blue-700 mt-1">
                            Reviewed: {new Date(item.reviewedAt).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-2">No teacher remark yet.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : null}
            {questions.map((q: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-4 bg-white/80">
                <div className="flex items-start gap-3 mb-3">
                  <span className="mt-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#1E3A8A] px-2 text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <p className="font-semibold text-gray-900">
                    {q.questionText}
                  </p>
                </div>
                {q.type === 'fill-in-the-blank' && (
                  <p className="text-xs text-gray-600 mb-2">Fill in the blank(s) marked with ___ or [blank]</p>
                )}
                {q.type === 'multiple-choice' && q.options?.length > 0 ? (
                  <RadioGroup
                    value={answers[idx] ?? ''}
                    onValueChange={(v) => setAnswers((prev) => ({ ...prev, [idx]: v }))}
                    className="space-y-2"
                  >
                    {q.options.map((opt: string, i: number) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 rounded-md border px-3 py-2 transition ${
                          (answers[idx] ?? '') === String(i)
                            ? 'border-[#1E3A8A] bg-blue-50'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <RadioGroupItem value={String(i)} id={`q${idx}-${i}`} />
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                          {getQuestionLabel(i)}
                        </span>
                        <Label htmlFor={`q${idx}-${i}`} className="cursor-pointer flex-1 text-sm text-gray-800">
                          {opt || `Option ${getQuestionLabel(i)}`}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <Input
                    placeholder={q.type === 'fill-in-the-blank' ? 'Type your answer here' : 'Your answer'}
                    value={answers[idx] ?? ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [idx]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <Button
              className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90"
              onClick={handleSubmit}
              disabled={submitting || (attemptSummary?.remainingAttempts ?? 1) <= 0}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
            {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
