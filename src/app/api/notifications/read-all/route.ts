import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Notification from '@/models/Notification';
import { getEffectiveRole } from '@/lib/auth';

export async function PATCH() {
  const { userId } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const result = await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    return NextResponse.json({ success: true, updatedCount: result.modifiedCount || 0 });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
