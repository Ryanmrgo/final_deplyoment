import connectDB from '@/config/db';
import { getEffectiveRole } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { saveFileLocally } from '@/lib/localUpload';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

const canUseCloudinary = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const uploadFile = async (file: File) => {
  if (canUseCloudinary()) {
    return uploadToCloudinary(file, {
      folder: 'submissions',
      resourceType: 'raw',
    });
  }
  return saveFileLocally(file);
};

// GET /api/student/submissions?assignmentId=... or ?courseId=...
export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId || role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assignmentId = searchParams.get('assignmentId');
  const courseId = searchParams.get('courseId');

  await connectDB();

  const query: any = { studentId: userId };
  if (assignmentId && assignmentId !== 'all') {
    query.assignmentId = new mongoose.Types.ObjectId(assignmentId);
  } else if (courseId) {
    query.courseId = new mongoose.Types.ObjectId(courseId);
  }

  const submissions = await Submission.find(query)
    .populate('assignmentId', 'title maxPoints dueDate')
    .sort({ submittedAt: -1 });

  return NextResponse.json({ items: submissions });
}

// POST /api/student/submissions
export async function POST(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId || role !== 'student') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type') || '';
  let assignmentId: string | null = null;
  let courseId: string | null = null;
  let content = '';
  const attachmentFiles: File[] = [];
  let attachmentUrls: string[] = [];

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData();
    assignmentId = formData.get('assignmentId') as string;
    courseId = formData.get('courseId') as string;
    content = (formData.get('content') as string) || '';
    const files = formData.getAll('attachments');
    for (const f of files) {
      if (f instanceof File && f.size > 0) {
        attachmentFiles.push(f);
      }
    }
  } else {
    const body = await req.json();
    assignmentId = body.assignmentId;
    courseId = body.courseId;
    content = body.content || '';
    if (Array.isArray(body.attachments)) {
      attachmentUrls = body.attachments
        .map((item: unknown) => String(item || '').trim())
        .filter(Boolean);
    }
  }

  if (!assignmentId || !courseId) {
    return NextResponse.json(
      { error: 'assignmentId and courseId are required' },
      { status: 400 }
    );
  }

  try {
    await connectDB();

    // Fetch assignment
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Due date check
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isLate = now > dueDate;
    if (isLate && !assignment.allowLateSubmission) {
      return NextResponse.json(
        { error: 'Submission deadline has passed and late submissions are not allowed' },
        { status: 400 }
      );
    }

    // Check for existing submission
    const existing = await Submission.findOne({ studentId: userId, assignmentId });
    if (existing) {
      return NextResponse.json(
        { error: 'You have already submitted this assignment' },
        { status: 400 }
      );
    }

    // Upload attachment files
    if (attachmentFiles.length > 0) {
      for (const file of attachmentFiles) {
        const uploaded = await uploadFile(file);
        attachmentUrls.push(uploaded.url);
      }
    }

    // Create submission
    const submission = new Submission({
      studentId: userId,
      assignmentId: new mongoose.Types.ObjectId(assignmentId),
      courseId: new mongoose.Types.ObjectId(courseId),
      content: content.trim(),
      attachments: attachmentUrls,
      submittedAt: now,
      isLate,
      status: 'Submitted',
    });

    await submission.save();

    // Populate assignment data for response
    await submission.populate('assignmentId', 'title maxPoints dueDate');

    return NextResponse.json({ success: true, submission }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating submission:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit assignment' },
      { status: 500 }
    );
  }
}