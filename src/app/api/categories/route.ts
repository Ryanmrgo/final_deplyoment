import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Category from '@/models/Category';

const FALLBACK = [
  { id: '1', name: 'Web Development', icon: '💻' },
  { id: '2', name: 'Data Science', icon: '📊' },
  { id: '3', name: 'Mobile Development', icon: '📱' },
  { id: '4', name: 'UI/UX Design', icon: '🎨' },
  { id: '5', name: 'Business', icon: '💼' },
  { id: '6', name: 'Languages', icon: '🌍' },
];

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find({ isActive: true }).sort({ createdAt: 1 }).lean();

    if (!categories.length) {
      return NextResponse.json({ items: FALLBACK });
    }

    const items = categories.map((category: any) => ({
      id: String(category._id),
      name: String(category.name || ''),
      icon: String(category.icon || '📚'),
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching public categories:', error);
    return NextResponse.json({ items: FALLBACK });
  }
}
