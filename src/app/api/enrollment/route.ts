import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';
import mongoose from 'mongoose';
import { getEffectiveRole } from '@/lib/auth';

export async function POST(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  const body = await req.json();

  if (!body?.courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  try {
    await connectDB();

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      studentId: userId,
      courseId: new mongoose.Types.ObjectId(body.courseId),
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = new Enrollment({
      studentId: userId,
      courseId: new mongoose.Types.ObjectId(body.courseId),
      enrolledAt: new Date(),
    });
    await enrollment.save();

    // Update course student count
    await Course.findByIdAndUpdate(
      body.courseId,
      {
        $push: { students: userId },
        $inc: { totalStudents: 1 },
      },
      { new: true }
    );

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    return NextResponse.json({ error: 'Failed to enroll in course' }, { status: 500 });
  }
}
