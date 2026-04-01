import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Notification from '@/models/Notification';
import { getEffectiveRole } from '@/lib/auth';

export async function GET() {
  const { userId } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const count = await Notification.countDocuments({ recipientId: userId, isRead: false });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
