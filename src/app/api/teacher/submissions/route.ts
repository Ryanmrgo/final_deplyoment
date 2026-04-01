import connectDB from '@/config/db';
import { getEffectiveRole } from '@/lib/auth';
import { normalizeFileAssets } from '@/lib/fileAsset';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
import User from '@/models/User';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

/**
 * GET /api/teacher/submissions?assignmentId=...&courseId=... (courseId optional, validates match)
 */
export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignmentId');
  const courseIdParam = searchParams.get('courseId');

  if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
    return NextResponse.json({ error: 'Valid assignmentId is required' }, { status: 400 });
  }

  try {
    await connectDB();

    const assignment = await Assignment.findById(assignmentId).lean();
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (String((assignment as any).instructorId) !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const assignmentCourseId = String((assignment as any).courseId || '');
    if (courseIdParam && assignmentCourseId && courseIdParam !== assignmentCourseId) {
      return NextResponse.json({ error: 'courseId does not match this assignment' }, { status: 400 });
    }

    const subs = await Submission.find({
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
    })
      .sort({ submittedAt: -1 })
      .lean();

    const studentIds = [...new Set(subs.map((s: any) => String(s.studentId)).filter(Boolean))];
    const users = await User.find({ _id: { $in: studentIds } }).select('_id name').lean();
    const userMap = Object.fromEntries(
      (users as any[]).map((u) => [String(u._id), String(u.name || 'Student')])
    );

    const maxPoints = Number((assignment as any).maxPoints) || 100;

    const items = subs.map((item: any) => ({
      _id: String(item._id),
      studentId: String(item.studentId),
      studentName: userMap[String(item.studentId)] || 'Student',
      assignmentId: String(item.assignmentId),
      courseId: String(item.courseId),
      content: item.content || '',
      attachments: normalizeFileAssets(item.attachments),
      submittedAt: item.submittedAt,
      isLate: Boolean(item.isLate),
      status: item.status,
      grade: item.grade,
      maxPoints,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching teacher submissions:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
