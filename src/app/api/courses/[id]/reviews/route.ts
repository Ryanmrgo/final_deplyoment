import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const body = await req.json();
    const rating = Number(body.rating);
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    if (!comment) {
      return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
    }

    await connectDB();

    const course = await Course.findById(id);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    if (String((course as any).instructor || '') === userId) {
      return NextResponse.json({ error: 'Instructors cannot review their own course' }, { status: 400 });
    }

    const enrollment = await Enrollment.findOne({ courseId: id, studentId: userId }).lean();
    if (!enrollment) {
      return NextResponse.json({ error: 'You must be enrolled to leave a review' }, { status: 403 });
    }

    const existing = (course.reviews || []).find((r: any) => r.studentId === userId);
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      existing.createdAt = new Date();
    } else {
      course.reviews.push({
        studentId: userId,
        rating,
        comment,
        createdAt: new Date(),
      } as any);
    }

    const reviews = course.reviews || [];
    course.rating = reviews.length
      ? Number((reviews.reduce((sum: number, r: any) => sum + (Number(r.rating) || 0), 0) / reviews.length).toFixed(2))
      : 0;
    course.updatedAt = new Date();

    await course.save();

    return NextResponse.json({ success: true, rating: course.rating, reviewCount: reviews.length });
  } catch (error) {
    console.error('Error upserting review:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
