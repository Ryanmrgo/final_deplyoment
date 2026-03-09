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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/student/quizzes/${quizId}`)
      .then((r) => r.json())
      .then(setQuiz)
      .catch(() => setQuiz(null))
      .finally(() => setLoading(false));
  }, [quizId]);

  const handleSubmit = async () => {
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
      if (data.success) setResult(data.attempt);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || userRole !== 'student') {
    router.push('/auth/sign-in');
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
          <Link href={`/courses/${courseId}/learn`}>
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
              <div className="flex justify-center gap-4 pt-4">
                <Link href={`/courses/${courseId}/learn`}>
                  <Button className="bg-[#1E3A8A]">Back to Course</Button>
                </Link>
                <Button variant="outline" onClick={() => { setResult(null); setAnswers({}); }}>
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
        <Link href={`/courses/${courseId}/learn`} className="inline-flex items-center text-[#1E3A8A] hover:underline mb-6">
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
            {questions.map((q: any, idx: number) => (
              <div key={idx} className="border-b pb-6 last:border-b-0">
                <p className="font-semibold mb-3">
                  {idx + 1}. {q.questionText}
                </p>
                {q.type === 'fill-in-the-blank' && (
                  <p className="text-xs text-gray-600 mb-2">Fill in the blank(s) marked with ___ or [blank]</p>
                )}
                {q.type === 'multiple-choice' && q.options?.length > 0 ? (
                  <RadioGroup
                    value={answers[idx] ?? ''}
                    onValueChange={(v) => setAnswers((prev) => ({ ...prev, [idx]: v }))}
                  >
                    {q.options.map((opt: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2 py-2">
                        <RadioGroupItem value={opt} id={`q${idx}-${i}`} />
                        <Label htmlFor={`q${idx}-${i}`} className="cursor-pointer">{opt}</Label>
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
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
