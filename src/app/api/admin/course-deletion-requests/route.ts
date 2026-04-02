import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import CourseDeletionRequest from '@/models/CourseDeletionRequest';
import User from '@/models/User';
import { getEffectiveRole } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId || role !== 'admin') {
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
      CourseDeletionRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CourseDeletionRequest.countDocuments(query),
    ]);

    const teacherIds = [...new Set(requests.map((r: any) => String(r.teacherId)).filter(Boolean))];
    const teachers = await User.find({ _id: { $in: teacherIds } }).select('_id name email').lean();
    const teacherMap = Object.fromEntries(
      (teachers as any[]).map((t) => [String(t._id), { name: t.name || '', email: t.email || '' }])
    );

    const courseOidStrings = [
      ...new Set(
        requests
          .map((r: any) => String(r.courseId || ''))
          .filter((id: string) => id && mongoose.Types.ObjectId.isValid(id))
      ),
    ];
    const courseOids = courseOidStrings.map((id) => new mongoose.Types.ObjectId(id));
    const courseDocs =
      courseOids.length > 0 ? await Course.find({ _id: { $in: courseOids } }).select('title').lean() : [];
    const titleByCourseId = Object.fromEntries(
      (courseDocs as any[]).map((c) => [String(c._id), String(c.title || '').trim()])
    );

    const totalPages = Math.max(1, Math.ceil(total / limit));

    const items = requests.map((item: any) => {
      const t = teacherMap[item.teacherId] || { name: '', email: '' };
      const cid = String(item.courseId || '');
      const storedTitle = String(item.courseTitle || '').trim();
      const liveTitle = titleByCourseId[cid] || '';
      const courseTitle = storedTitle || liveTitle || 'Untitled course';
      return {
        id: String(item._id),
        teacherId: item.teacherId,
        teacherName: t.name || 'Teacher',
        teacherEmail: t.email || '',
        courseId: cid,
        courseTitle,
        status: item.status,
        teacherMessage: item.teacherMessage || '',
        adminNote: item.adminNote || '',
        reviewedBy: item.reviewedBy || '',
        reviewedAt: item.reviewedAt || null,
        createdAt: item.createdAt,
      };
    });

    return NextResponse.json({
      items,
      meta: { page, limit, total, totalPages, status: statusParam },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch deletion requests' }, { status: 500 });
  }
}
