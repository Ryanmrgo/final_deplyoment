"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BookOpen, Home, Library, User, LogIn, Users, LayoutDashboard, Bell } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/app/components/AuthContext';
import { Badge } from '@/app/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { NotificationItem } from '@/app/types/notifications';

interface NavbarProps {
  userRole?: 'student' | 'teacher' | 'admin' | null;
  onLogout?: () => void;
}

export function Navbar({ userRole }: NavbarProps) {
  const pathname = usePathname();
  const { userRole: contextRole, isLoading } = useAuth();
  const resolvedRole = userRole ?? contextRole;
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      const data = await res.json();
      if (!res.ok) return;
      setUnreadCount(Number(data.count || 0));
    } catch {
      // Ignore transient fetch errors in navbar polling.
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const res = await fetch('/api/notifications?limit=8');
      const data = await res.json();
      if (!res.ok) return;
      setNotifications(data.items || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore transient write errors and keep UX responsive.
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore transient write errors and keep UX responsive.
    }
  };

  useEffect(() => {
    if (isLoading) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (!notificationOpen) return;
    fetchNotifications();
  }, [notificationOpen]);

  return (
    <nav className="bg-[#1E3A8A] text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <BookOpen className="w-8 h-8 text-[#F59E0B]" />
            <span className="text-2xl font-semibold">AlinHub</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                isActive('/') ? 'text-[#F59E0B]' : ''
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </Link>

            <Link
              href="/courses"
              className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                isActive('/courses') ? 'text-[#F59E0B]' : ''
              }`}
            >
              <Library className="w-5 h-5" />
              <span>Courses</span>
            </Link>

            {!isLoading && resolvedRole === 'student' && (
              <Link
                href="/dashboard/student"
                className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                  isActive('/dashboard/student') ? 'text-[#F59E0B]' : ''
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>My Dashboard</span>
              </Link>
            )}

            {!isLoading && resolvedRole === 'teacher' && (
              <Link
                href="/dashboard/teacher"
                className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                  isActive('/dashboard/teacher') ? 'text-[#F59E0B]' : ''
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>My Courses</span>
              </Link>
            )}

            {!isLoading && resolvedRole === 'admin' && (
              <Link
                href="/dashboard/admin"
                className={`flex items-center gap-2 hover:text-[#F59E0B] transition ${
                  isActive('/dashboard/admin') ? 'text-[#F59E0B]' : ''
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Auth Buttons */}
            <SignedOut>
              <div className="flex items-center gap-3 ml-4">
                <Link href="/auth/sign-in">
                  <Button variant="ghost" className="text-white hover:text-[#F59E0B] hover:bg-white/10">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="bg-[#F59E0B] text-white hover:bg-[#F59E0B]/90">
                    Get Started
                  </Button>
                </Link>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="flex items-center gap-3 ml-4">
                <Popover open={notificationOpen} onOpenChange={setNotificationOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="relative text-white hover:text-[#F59E0B] hover:bg-white/10">
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 ? (
                        <Badge className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Badge>
                      ) : null}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-96 p-0">
                    <div className="border-b px-4 py-3 flex items-center justify-between">
                      <p className="font-semibold text-gray-900">Notifications</p>
                      <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                        Mark all read
                      </Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifications ? (
                        <p className="p-4 text-sm text-gray-600">Loading notifications...</p>
                      ) : notifications.length === 0 ? (
                        <p className="p-4 text-sm text-gray-600">No notifications yet.</p>
                      ) : (
                        notifications.map((item) => (
                          <Link
                            key={item.id}
                            href={item.actionUrl || '/notifications'}
                            className={`block border-b px-4 py-3 hover:bg-gray-50 ${item.isRead ? '' : 'bg-blue-50/60'}`}
                            onClick={() => markNotificationAsRead(item.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                              {!item.isRead ? <span className="mt-1 inline-block h-2 w-2 rounded-full bg-blue-600" /> : null}
                            </div>
                            <p className="mt-1 text-xs text-gray-600">{item.message}</p>
                          </Link>
                        ))
                      )}
                    </div>
                    <div className="p-3">
                      <Link href="/notifications">
                        <Button variant="outline" className="w-full" size="sm">
                          View all notifications
                        </Button>
                      </Link>
                    </div>
                  </PopoverContent>
                </Popover>
                {!isLoading && resolvedRole && (
                  <Link href={`/dashboard/${resolvedRole}`}>
                    <Button variant="ghost" className="text-white hover:text-[#F59E0B] hover:bg-white/10">
                      <User className="w-4 h-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                )}
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-10 h-10',
                    },
                  }}
                />
              </div>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
}
