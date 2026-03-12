import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Category from '@/models/Category';
import { getEffectiveRole } from '@/lib/auth';

export async function GET() {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    await connectDB();
    const items = await Category.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    const body = await req.json();
    const name = String(body.name || '').trim();
    const icon = String(body.icon || '📚').trim();

    if (!name) return NextResponse.json({ error: 'Category name is required' }, { status: 400 });

    await connectDB();

    const exists = await Category.findOne({ name: new RegExp(`^${name}$`, 'i') }).lean();
    if (exists) return NextResponse.json({ error: 'Category already exists' }, { status: 409 });

    const category = await Category.create({
      name,
      icon,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
