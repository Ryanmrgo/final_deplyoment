import connectDB from '@/config/db';
import { getEffectiveRole } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { normalizeFileAsset, normalizeFileAssets } from '@/lib/fileAsset';
import { saveFileLocally } from '@/lib/localUpload';
import { useCloudinaryForStorage } from '@/lib/uploadStrategy';
import { createNotification } from '@/lib/notifications';
import Assignment from '@/models/Assignment';
import Submission from '@/models/Submission';
import User from '@/models/User';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

const uploadFile = async (file: File) => {
  if (useCloudinaryForStorage()) {
    return uploadToCloudinary(file, {
      folder: 'submissions',
      resourceType: 'raw',
    });
  }
  return saveFileLocally(file, 'submissions');
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
    .sort({ submittedAt: -1 })
    .lean();

  return NextResponse.json({
    items: submissions.map((item: any) => ({
      ...item,
      attachments: normalizeFileAssets(item.attachments),
    })),
  });
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
  let attachmentUrls = normalizeFileAssets([]);

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
    const text = String(body.content || '').trim();
    const link = String(body.url || '').trim();
    content =
      link && text
        ? `${text}\n\nLink: ${link}`
        : link
          ? `Link: ${link}`
          : text;
    if (Array.isArray(body.attachments)) {
      attachmentUrls = normalizeFileAssets(body.attachments);
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
        const normalized = normalizeFileAsset({
          url: uploaded.url,
          name: uploaded.name || file.name,
          mimeType: file.type || uploaded.type || '',
          extension: String(file.name.split('.').pop() || '').toLowerCase(),
          size: file.size,
        });
        if (normalized) attachmentUrls.push(normalized);
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

    const submitter =
      (await User.findById(userId).select('name').lean()) as { name?: string } | null;
    const submitterName = submitter?.name?.trim() || 'A student';
    const assignTitle = String(assignment.title || 'assignment');
    const courseIdStr = String(courseId);

    await createNotification({
      recipientId: String(assignment.instructorId),
      recipientRole: 'teacher',
      type: 'assignment.submitted',
      title: 'New assignment submission',
      message: `${submitterName} submitted "${assignTitle}". Open the course to review and grade.`,
      entityType: 'assignment',
      entityId: String(assignment._id),
      actionUrl: `/dashboard/teacher/course/${courseIdStr}#assignments`,
      priority: 'high',
      metadata: {
        assignmentId: String(assignment._id),
        courseId: courseIdStr,
        studentId: userId,
        submissionId: String(submission._id),
      },
    });

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