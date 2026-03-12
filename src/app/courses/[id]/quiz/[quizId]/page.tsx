import { QuizTake } from '@/app/pages/QuizTake';

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string; quizId: string }>;
}) {
  const { id, quizId } = await params;
  return <QuizTake courseId={id} quizId={quizId} />;
}
