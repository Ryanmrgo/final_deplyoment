import connectDB from '@/config/db';
import { getEffectiveRole } from '@/lib/auth';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { saveFileLocally } from '@/lib/localUpload';
import { useCloudinaryForStorage } from '@/lib/uploadStrategy';
import { normalizeFileAsset, normalizeFileAssets } from '@/lib/fileAsset';
import Assignment from '@/models/Assignment';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');

    const query: any = { instructorId: userId };
    if (courseId) {
      query.courseId = new mongoose.Types.ObjectId(courseId);
    }

    const assignments = await Assignment.find(query).sort({ createdAt: -1 }).lean();
    const items = assignments.map((item: any) => ({
      ...item,
      attachments: normalizeFileAssets(item.attachments),
    }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

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

    if (!body?.title || !body?.courseId) {
      return NextResponse.json({ error: 'title and courseId are required' }, { status: 400 });
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

    const assignment = new Assignment({
      title: body.title,
      description: body.description || '',
      courseId: new mongoose.Types.ObjectId(body.courseId as string),
      instructorId: userId,
      dueDate: body.dueDate || new Date(),
      maxPoints: body.maxPoints || 100,
      instructions: body.instructions || '',
      isPublished: false,
      attachments: uploadedFiles,
      url:
        (url ||
          (typeof body.url === 'string' ? String(body.url).trim() : '')) ||
        undefined,
      allowLateSubmission: body.allowLateSubmission === 'true' || body.allowLateSubmission === true,
    });
    await assignment.save();
    return NextResponse.json({ success: true, assignment });
  } catch (error) {
    console.error('Error creating assignment:', error);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}
