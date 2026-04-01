import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Lesson from '@/models/Lesson';
import Enrollment from '@/models/Enrollment';
import Course from '@/models/Course';

// Get lessons for a course - students must be enrolled, teachers must own the course
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
    }

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const course = await Course.findById(id).lean();
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const isInstructor = (course as any).instructor?.toString() === userId;
    const enrollment = await Enrollment.findOne({ courseId: id, studentId: userId });

    if (!isInstructor && !enrollment) {
      return NextResponse.json({ error: 'Enroll in course to view lessons' }, { status: 403 });
    }

    const courseObjectId = new mongoose.Types.ObjectId(id);
    const lessons = await Lesson.find({
      courseId: courseObjectId,
      $or: [{ isPublished: true }, { isPublished: { $exists: false } }],
    })
      .sort({ order: 1 })
      .lean();

    const items = lessons.map((l: any) => {
      const derivedVideo =
        l.video?.url
          ? l.video
          : l.youtubeUrl
            ? { type: 'youtube', url: l.youtubeUrl }
            : l.fileUrl && (l.contentType === 'video' || l.type === 'video')
              ? { type: 'upload', url: l.fileUrl }
              : null;

      const derivedFiles =
        Array.isArray(l.files) && l.files.length
          ? l.files
          : l.fileUrl && !derivedVideo
            ? [
                {
                  fileName: `Lesson file.${l.fileType || 'file'}`,
                  fileUrl: l.fileUrl,
                  fileType: l.fileType || 'file',
                },
              ]
            : [];

      return {
        id: l._id?.toString?.() ?? l._id,
        title: l.title,
        sectionTitle: l.sectionTitle,
        description: l.description,
        type: l.type,
        content: l.content,
        contentType: l.contentType,
        fileUrl: l.fileUrl,
        fileType: l.fileType,
        youtubeUrl: l.youtubeUrl,
        video: derivedVideo,
        files: derivedFiles,
        order: l.order,
        duration: l.duration,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}
