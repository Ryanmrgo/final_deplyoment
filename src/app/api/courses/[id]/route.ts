import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import User from '@/models/User';
import Enrollment from '@/models/Enrollment';
import { auth } from '@clerk/nextjs/server';

// Public route - fetch single course by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    const course = await Course.findById(id).lean();

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let userId: string | null = null;
    try {
      const authResult = await auth();
      userId = authResult.userId ?? null;
    } catch {
      // not authenticated
    }

    // Moodle-like: Draft courses are hidden from students; only instructor can view
    const courseStatus = (course as any).status || 'Draft';
    const isInstructor = !!(userId && userId === (course as any).instructor);
    if (courseStatus === 'Draft' && !isInstructor) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get instructor name
    const instructor = await User.findById(course.instructor).lean();
    const instructorName = instructor?.name || 'Instructor';

    // Check if current user is enrolled (if authenticated)
    let isEnrolled = false;
    let enrollmentId = null;
    let enrollmentProgress = 0;
    if (userId) {
      const enrollment = await Enrollment.findOne({
        studentId: userId,
        courseId: id,
      }).lean();
      if (enrollment) {
        isEnrolled = true;
        enrollmentId = (enrollment as any)._id?.toString();
        enrollmentProgress = (enrollment as any).progress ?? 0;
      }
    }

    const result = {
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      category: course.category,
      status: courseStatus,
      instructor: {
        name: instructorName,
        avatar: '👩‍🏫',
        bio: instructor?.headline || instructor?.bio || 'Expert instructor',
      },
      rating: course.rating || 0,
      reviewCount: course.reviews?.length || 0,
      students: course.totalStudents || 0,
      level: course.level || 'Beginner',
      duration: course.duration ? `${course.duration}h` : '0h',
      durationHours: course.duration || 0,
      image: course.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450',
      price: (course as any).price ?? 0,
      language: (course as any).language || 'English',
      requirements: (course as any).requirements || '',
      outcomes: (course as any).outcomes || '',
      syllabusUrl: (course as any).syllabusUrl || '',
      syllabusName: (course as any).syllabusName || '',
      syllabusType: (course as any).syllabusType || '',
      syllabus: (course as any).syllabus || [],
      reviews: (course.reviews || []).map((r: any) => ({
        id: r._id?.toString() || r.studentId,
        student: 'Student',
        rating: r.rating,
        comment: r.comment,
        date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : '',
      })),
      isEnrolled,
      enrollmentId,
      enrollmentProgress,
      isInstructor,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json({ error: 'Failed to fetch course' }, { status: 500 });
  }
}
