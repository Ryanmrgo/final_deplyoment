import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Category from '@/models/Category';
import { getEffectiveRole } from '@/lib/auth';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    const body = await req.json();
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name !== undefined) updates.name = String(body.name || '').trim();
    if (body.icon !== undefined) updates.icon = String(body.icon || '📚').trim();
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    await connectDB();
    const category = await Category.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
    }

    await connectDB();
    const deleted = await Category.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: 'Category not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
