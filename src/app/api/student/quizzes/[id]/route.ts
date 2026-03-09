import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Quiz from '@/models/Quiz';
import Enrollment from '@/models/Enrollment';

// Get quiz for taking - strips correct answers
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Quiz ID required' }, { status: 400 });

    await connectDB();
    const quiz = await Quiz.findById(id).lean();
    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    if (!(quiz as any).isPublished) {
      return NextResponse.json({ error: 'Quiz is not published yet' }, { status: 403 });
    }

    const enrollment = await Enrollment.findOne({ courseId: (quiz as any).courseId, studentId: userId });
    if (!enrollment) return NextResponse.json({ error: 'Enroll in course first' }, { status: 403 });

    const questions = ((quiz as any).questions || []).map((q: any, i: number) => ({
      index: i,
      questionText: q.questionText,
      type: q.type,
      options: q.options || [],
      points: q.points ?? 1,
    }));

    return NextResponse.json({
      id: (quiz as any)._id,
      title: (quiz as any).title,
      description: (quiz as any).description,
      totalPoints: (quiz as any).totalPoints,
      passingScore: (quiz as any).passingScore ?? 70,
      timeLimit: (quiz as any).timeLimit ?? 0,
      questions,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
  }
}
