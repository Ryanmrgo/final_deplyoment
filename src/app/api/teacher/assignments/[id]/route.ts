import connectDB from '@/config/db';
import { getEffectiveRole } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { saveFileLocally } from '@/lib/localUpload';
import { useCloudinaryForStorage } from '@/lib/uploadStrategy';
import { normalizeFileAsset, normalizeFileAssets } from '@/lib/fileAsset';
import { createNotificationsBulk } from '@/lib/notifications';
import Assignment from '@/models/Assignment';
import Enrollment from '@/models/Enrollment';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    let body: Record<string, unknown> = {};
    let files: File[] = [];
    let url = '';

    if (isMultipart) {
      const formData = await req.formData();
      body = Object.fromEntries(
        Array.from(formData.entries()).filter(([, value]) => typeof value === 'string')
      );
      files = formData
        .getAll('files')
        .filter((entry): entry is File => entry instanceof File && entry.size > 0);
      url = (formData.get('url') as string) || '';
    } else {
      body = await req.json();
    }

    await connectDB();

    // Handle file uploads
    const uploadedFiles = normalizeFileAssets(body.attachments);

    if (uploadedFiles.length === 0 && files.length > 0) {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
          return NextResponse.json({ error: 'File size exceeds 20MB limit' }, { status: 400 });
        }
        try {
          const uploadResult = useCloudinaryForStorage()
            ? await uploadToCloudinary(file, { folder: 'assignments', resourceType: 'raw' })
            : await saveFileLocally(file, 'assignments');
          const normalized = normalizeFileAsset({
            url: uploadResult.url,
            name: uploadResult.name || file.name,
            mimeType: file.type || uploadResult.type || '',
            extension: String(file.name.split('.').pop() || '').toLowerCase(),
            size: file.size,
          });
          if (normalized) uploadedFiles.push(normalized);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
        }
      }
    }

    const allowedFields = ['title', 'description', 'dueDate', 'maxPoints', 'allowLateSubmission', 'isPublished', 'instructions'];
    const update: any = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (body[field] !== undefined) update[field] = body[field];
    }

    // Handle attachments and URL
    if (uploadedFiles.length > 0) {
      update.attachments = uploadedFiles;
    }
    if (url) {
      update.url = url;
    } else if (body.url !== undefined) {
      update.url = typeof body.url === 'string' ? body.url.trim() : '';
    }

    const assignment = await Assignment.findOneAndUpdate(
      { _id: id, instructorId: userId },
      update,
      { new: true }
    );
    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    const publishFlagProvided = body.isPublished !== undefined;
    const isNowPublished = Boolean((assignment as any).isPublished);
    if (publishFlagProvided && isNowPublished) {
      const enrolled = await Enrollment.find({ courseId: (assignment as any).courseId })
        .select('studentId')
        .lean();
      if (enrolled.length > 0) {
        await createNotificationsBulk(
          enrolled.map((item: any) => ({
            recipientId: String(item.studentId),
            recipientRole: 'student' as const,
            type: 'assignment.published' as const,
            title: 'New assignment published',
            message: `A new assignment "${String((assignment as any).title || 'assignment')}" is now available.`,
            entityType: 'assignment' as const,
            entityId: String((assignment as any)._id),
            actionUrl: `/courses/${String((assignment as any).courseId)}`,
            priority: 'medium' as const,
            metadata: {
              assignmentId: String((assignment as any)._id),
              courseId: String((assignment as any).courseId),
            },
          }))
        );
      }
    }

    return NextResponse.json({
      success: true,
      assignment: {
        ...(assignment as any).toObject(),
        attachments: normalizeFileAssets((assignment as any).attachments),
      },
    });
  } catch (error) {
    console.error('Error updating assignment:', error);
    return NextResponse.json({ error: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'teacher') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const assignment = await Assignment.findOneAndDelete({ _id: id, instructorId: userId });
  if (!assignment) {
    return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}