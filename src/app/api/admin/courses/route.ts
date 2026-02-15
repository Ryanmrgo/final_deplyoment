import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import User from '@/models/User';

export async function GET() {
  const { sessionClaims } = await auth();

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  try {
    await connectDB();

    const courses = await Course.find().sort({ createdAt: -1 }).limit(50).populate('instructor').lean();

    const instructorIds = [...new Set(courses.map((c: any) => c.instructor?.toString?.() || c.instructor))];
    const users = await User.find({ _id: { $in: instructorIds } }).lean();
    const userMap = Object.fromEntries(users.map((u: any) => [u._id, u.name]));

    const items = courses.map((c: any) => ({
      id: c._id,
      title: c.title,
      category: c.category,
      status: c.status,
      totalStudents: c.totalStudents,
      rating: c.rating,
      instructorName: userMap[c.instructor?.toString?.() || c.instructor] || 'Unknown',
      image: c.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450',
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
