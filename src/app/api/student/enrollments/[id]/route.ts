import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Enrollment from '@/models/Enrollment';
import Lesson from '@/models/Lesson';
import mongoose from 'mongoose';
import { getEffectiveRole } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'Enrollment ID required' }, { status: 400 });
  }

  try {
    await connectDB();

    const enrollmentDoc = await Enrollment.findOne({
      _id: new mongoose.Types.ObjectId(id),
      studentId: userId,
    });

    if (!enrollmentDoc) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const now = new Date();
    enrollmentDoc.updatedAt = now;
    enrollmentDoc.lastAccessedAt = now;

    // Backward compatibility: allow direct numeric progress updates if still used.
    if (typeof body.progress === 'number') {
      enrollmentDoc.progress = Math.min(100, Math.max(0, body.progress));
    }

    const lessonId = typeof body.lessonId === 'string' ? body.lessonId.trim() : '';
    const shouldCompleteLesson = body.completed === true && lessonId.length > 0;
    if (shouldCompleteLesson) {
      if (!mongoose.Types.ObjectId.isValid(lessonId)) {
        return NextResponse.json({ error: 'Invalid lessonId' }, { status: 400 });
      }

      const lesson = await Lesson.findOne({
        _id: new mongoose.Types.ObjectId(lessonId),
        courseId: enrollmentDoc.courseId,
        $or: [{ isPublished: true }, { isPublished: { $exists: false } }],
      })
        .select('_id')
        .lean();

      if (!lesson) {
        return NextResponse.json({ error: 'Lesson not found in this course' }, { status: 400 });
      }

      const existingIds = new Set<string>(
        Array.isArray(enrollmentDoc.completedLessonIds)
          ? enrollmentDoc.completedLessonIds.map((value: unknown) => String(value))
          : []
      );
      existingIds.add(lessonId);
      enrollmentDoc.completedLessonIds = Array.from(existingIds);
    }

    const totalLessons = await Lesson.countDocuments({
      courseId: enrollmentDoc.courseId,
      $or: [{ isPublished: true }, { isPublished: { $exists: false } }],
    });

    if (totalLessons > 0) {
      const completedCount = Array.isArray(enrollmentDoc.completedLessonIds)
        ? enrollmentDoc.completedLessonIds.length
        : 0;
      enrollmentDoc.progress = Math.min(100, Math.max(0, Math.round((completedCount / totalLessons) * 100)));
    }

    if (enrollmentDoc.progress >= 100) {
      enrollmentDoc.status = 'Completed';
      enrollmentDoc.completedAt = enrollmentDoc.completedAt || now;
      enrollmentDoc.certificate = { issued: true, issuedAt: now, certificateUrl: '' };
    } else if (enrollmentDoc.status === 'Completed') {
      enrollmentDoc.status = 'Active';
      enrollmentDoc.completedAt = null;
      enrollmentDoc.certificate = { issued: false, issuedAt: null, certificateUrl: '' };
    }

    await enrollmentDoc.save();

    const enrollment = await Enrollment.findById(enrollmentDoc._id).populate('courseId').lean();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
