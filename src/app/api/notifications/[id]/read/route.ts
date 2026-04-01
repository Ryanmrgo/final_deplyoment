import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Notification from '@/models/Notification';
import { getEffectiveRole } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
  }

  try {
    await connectDB();

    const notification = await Notification.findById(id);
    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notification.recipientId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
