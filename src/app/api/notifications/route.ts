import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Notification from '@/models/Notification';
import { getEffectiveRole } from '@/lib/auth';

export async function GET(req: Request) {
  const { userId } = await getEffectiveRole();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const url = new URL(req.url);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20)));
    const unreadOnly = String(url.searchParams.get('unreadOnly') || 'false') === 'true';

    const query: Record<string, unknown> = { recipientId: userId };
    if (unreadOnly) query.isRead = false;

    const itemsRaw = await Notification.find(query).sort({ createdAt: -1 }).limit(limit).lean();
    const items = itemsRaw.map((item: any) => ({
      id: String(item._id),
      recipientId: item.recipientId,
      recipientRole: item.recipientRole,
      type: item.type,
      title: item.title,
      message: item.message,
      entityType: item.entityType,
      entityId: item.entityId || undefined,
      actionUrl: item.actionUrl || undefined,
      priority: item.priority,
      isRead: Boolean(item.isRead),
      readAt: item.readAt ? new Date(item.readAt).toISOString() : null,
      metadata: item.metadata || {},
      createdAt: new Date(item.createdAt).toISOString(),
      updatedAt: new Date(item.updatedAt).toISOString(),
    }));

    return NextResponse.json({ items, nextCursor: null });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
