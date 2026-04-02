import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import Enrollment from '@/models/Enrollment';
import EnrollmentRequest from '@/models/EnrollmentRequest';
import User from '@/models/User';
import { getEffectiveRole } from '@/lib/auth';
import { createNotification, createNotificationsBulk } from '@/lib/notifications';
import { courseSeatEnrollmentAndClauses, getCourseMaxEnrollments } from '@/lib/enrollmentCap';

interface CreateEnrollmentRequestBody {
  courseId?: string;
  fullName?: string;
  age?: number;
  educationalBackground?: string;
  reasonForJoining?: string;
}

export async function POST(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  let body: CreateEnrollmentRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const fullName = String(body.fullName || '').trim();
  const educationalBackground = String(body.educationalBackground || '').trim();
  const reasonForJoining = String(body.reasonForJoining || '').trim();
  const age = Number(body.age);
  const courseId = String(body.courseId || '').trim();

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    return NextResponse.json({ error: 'Valid courseId is required' }, { status: 400 });
  }
  if (!fullName || !educationalBackground || !reasonForJoining) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  if (!Number.isFinite(age) || age <= 0) {
    return NextResponse.json({ error: 'Age must be a valid number' }, { status: 400 });
  }

  try {
    await connectDB();

    const course = await Course.findById(courseId)
      .select('_id status title maxEnrollments instructor')
      .lean();
    if (!course || (course as any).status !== 'Published') {
      return NextResponse.json({ error: 'Course not available for enrollment' }, { status: 404 });
    }

    const alreadyEnrolled = await Enrollment.findOne({
      $and: [{ studentId: userId }, ...courseSeatEnrollmentAndClauses(courseId)],
    }).lean();
    if (alreadyEnrolled) {
      return NextResponse.json({ error: 'You are already enrolled in this course' }, { status: 409 });
    }

    const maxEnrollments = getCourseMaxEnrollments(course as any);
    const activeCount = await Enrollment.countDocuments({
      $and: courseSeatEnrollmentAndClauses(courseId),
    });
    if (activeCount >= maxEnrollments) {
      return NextResponse.json(
        { error: `This course is full (${activeCount}/${maxEnrollments}). Try again later or contact support.` },
        { status: 409 }
      );
    }

    const existingRequest = await EnrollmentRequest.findOne({ studentId: userId, courseId }).lean();
    if (existingRequest) {
      return NextResponse.json({ error: 'Enrollment request already exists', status: (existingRequest as any).status }, { status: 409 });
    }

    const requestDoc = await EnrollmentRequest.create({
      studentId: userId,
      courseId,
      fullName,
      age,
      educationalBackground,
      reasonForJoining,
      status: 'pending',
    });

    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (admins.length > 0) {
      const courseTitle = String((course as any).title || 'a course');
      await createNotificationsBulk(
        admins.map((admin: any) => ({
          recipientId: String(admin._id),
          recipientRole: 'admin' as const,
          type: 'enrollment.request_submitted' as const,
          title: 'New enrollment request',
          message: `${fullName} requested access to ${courseTitle}.`,
          entityType: 'enrollmentRequest' as const,
          entityId: String(requestDoc._id),
          actionUrl: '/dashboard/admin#enrollments',
          priority: 'high' as const,
          metadata: { courseId, studentId: userId, requestId: String(requestDoc._id) },
        }))
      );
    }

    const instructorId = String((course as any).instructor || '').trim();
    if (instructorId) {
      try {
        await createNotification({
          recipientId: instructorId,
          recipientRole: 'teacher',
          type: 'enrollment.request_submitted',
          title: 'New enrollment request for your course',
          message: `${fullName} requested to join "${String((course as any).title || 'your course')}". An administrator will review it.`,
          entityType: 'enrollmentRequest',
          entityId: String(requestDoc._id),
          actionUrl: `/dashboard/teacher/course/${courseId}`,
          priority: 'medium',
          metadata: { courseId, studentId: userId, requestId: String(requestDoc._id) },
        });
      } catch (e) {
        console.error('Teacher enrollment notification:', e);
      }
    }

    return NextResponse.json({
      success: true,
      request: {
        id: requestDoc._id,
        status: requestDoc.status,
      },
    });
  } catch (error) {
    console.error('Error creating enrollment request:', error);
    return NextResponse.json({ error: 'Failed to create enrollment request' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  try {
    await connectDB();

    const url = new URL(req.url);
    const statusParam = String(url.searchParams.get('status') || 'all').toLowerCase();
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 10)));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};
    if (statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected') {
      query.status = statusParam;
    }

    const [requests, total] = await Promise.all([
      EnrollmentRequest.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('studentId', '_id name email')
      .populate('courseId', '_id title')
      .lean(),
      EnrollmentRequest.countDocuments(query),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const items = requests.map((item: any) => ({
      id: String(item._id),
      studentId: item.studentId?._id || item.studentId,
      studentName: item.studentId?.name || item.fullName,
      studentEmail: item.studentId?.email || '',
      courseId: item.courseId?._id || item.courseId,
      courseName: item.courseId?.title || 'Unknown Course',
      fullName: item.fullName,
      age: item.age,
      educationalBackground: item.educationalBackground,
      reasonForJoining: item.reasonForJoining,
      status: item.status,
      createdAt: item.createdAt,
    }));

    return NextResponse.json({
      items,
      meta: {
        page,
        limit,
        total,
        totalPages,
        status: statusParam,
      },
    });
  } catch (error) {
    console.error('Error fetching enrollment requests:', error);
    return NextResponse.json({ error: 'Failed to fetch enrollment requests' }, { status: 500 });
  }
}
