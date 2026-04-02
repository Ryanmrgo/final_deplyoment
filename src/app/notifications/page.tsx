"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { NotificationItem } from '@/app/types/notifications';

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchItems = async (onlyUnread: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?limit=50&unreadOnly=${onlyUnread ? 'true' : 'false'}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch notifications');
      setItems(data.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(unreadOnly);
  }, [unreadOnly]);

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
  };

  const markAll = async () => {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notifications</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setUnreadOnly((prev) => !prev)}>
                {unreadOnly ? 'Show all' : 'Show unread only'}
              </Button>
              <Button size="sm" onClick={markAll}>
                Mark all as read
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-gray-600">Loading notifications...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-600">No notifications found.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className={`rounded-md border p-3 ${item.isRead ? 'bg-white' : 'bg-blue-50/50'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{item.title}</p>
                        {!item.isRead ? <Badge className="bg-blue-100 text-blue-700">Unread</Badge> : null}
                      </div>
                      {!item.isRead ? (
                        <Button size="sm" variant="outline" onClick={() => markAsRead(item.id)}>
                          Mark read
                        </Button>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                      {item.actionUrl && (item.actionUrl.startsWith('/') || item.actionUrl.startsWith('#')) ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <Link href={item.actionUrl}>Open link</Link>
                        </Button>
                      ) : item.actionUrl ? (
                        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
                          <a href={item.actionUrl} target="_blank" rel="noopener noreferrer">
                            Open link
                          </a>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
