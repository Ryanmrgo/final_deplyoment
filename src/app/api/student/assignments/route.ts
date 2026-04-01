import connectDB from '@/config/db';
import { getEffectiveRole } from '@/lib/auth';
import { normalizeFileAssets } from '@/lib/fileAsset';
import Assignment from '@/models/Assignment';
import Enrollment from '@/models/Enrollment';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');
  if (!courseId) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  await connectDB();

  const enrollment = await Enrollment.findOne({
    studentId: userId,
    courseId: new mongoose.Types.ObjectId(courseId),
  });

  if (!enrollment) {
    return NextResponse.json({ error: 'Not enrolled in this course' }, { status: 403 });
  }

  const assignments = await Assignment.find({
    courseId: new mongoose.Types.ObjectId(courseId),
    isPublished: true,
  })
    .sort({ dueDate: 1 })
    .lean();

  return NextResponse.json({
    items: assignments.map((item: any) => ({
      ...item,
      attachments: normalizeFileAssets(item.attachments),
    })),
  });
}
