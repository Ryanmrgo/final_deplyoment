import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Course from '@/models/Course';
import User from '@/models/User';

// Public route - no auth required for browsing course catalog
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = { status: 'Published' };

    if (category) {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const courses = await Course.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Enrich with instructor names
    const instructorIds = [...new Set(courses.map((c) => c.instructor as string))];
    const users = await User.find({ _id: { $in: instructorIds } }).lean();
    const userMap = Object.fromEntries(users.map((u) => [u._id, u.name]));

    const items = courses.map((course) => ({
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      category: course.category,
      instructor: {
        name: userMap[course.instructor as string] || 'Instructor',
        avatar: '👩‍🏫',
      },
      rating: course.rating || 0,
      reviewCount: course.reviews?.length || 0,
      students: course.totalStudents || 0,
      level: course.level || 'Beginner',
      duration: course.duration ? `${course.duration}h` : '0h',
      image: course.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450',
      price: course.price,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
