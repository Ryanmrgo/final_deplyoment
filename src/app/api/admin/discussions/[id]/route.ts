import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/config/db';
import Discussion from '@/models/Discussion';
import { getEffectiveRole } from '@/lib/auth';

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
      return NextResponse.json({ error: 'Invalid discussion ID' }, { status: 400 });
    }

    await connectDB();
    const deleted = await Discussion.findByIdAndDelete(id).lean();
    if (!deleted) return NextResponse.json({ error: 'Discussion not found' }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting discussion:', error);
    return NextResponse.json({ error: 'Failed to delete discussion' }, { status: 500 });
  }
}
