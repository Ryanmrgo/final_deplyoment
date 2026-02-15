import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';

export async function GET() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  try {
    await connectDB();
    const courses = await Course.find({ instructor: userId }).sort({ createdAt: -1 });
    return NextResponse.json({ items: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  if (role !== 'teacher') {
    return NextResponse.json({ error: 'Teacher role required' }, { status: 403 });
  }

  const body = await req.json();

  if (!body?.title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  try {
    await connectDB();
    const course = new Course({
      title: body.title,
      description: body.description || '',
      instructor: userId,
      category: body.category || 'General',
      level: body.level || 'Beginner',
      duration: body.duration || 0,
      image: body.image || '',
      price: body.price || 0,
    });
    await course.save();
    return NextResponse.json({ success: true, course });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
