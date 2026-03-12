import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Lesson from '@/models/Lesson';
import Enrollment from '@/models/Enrollment';
import Discussion from '@/models/Discussion';
import Progress from '@/models/Progress';
import Quiz from '@/models/Quiz';
import QuizAttempt from '@/models/QuizAttempt';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
import { getEffectiveRole } from '@/lib/auth';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    await connectDB();

    const deleted = await Course.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    await Promise.all([
      Lesson.deleteMany({ courseId: id }),
      Enrollment.deleteMany({ courseId: id }),
      Discussion.deleteMany({ courseId: id }),
      Progress.deleteMany({ courseId: id }),
      Quiz.deleteMany({ courseId: id }),
      QuizAttempt.deleteMany({ courseId: id }),
      Assignment.deleteMany({ courseId: id }),
      Submission.deleteMany({ courseId: id }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
