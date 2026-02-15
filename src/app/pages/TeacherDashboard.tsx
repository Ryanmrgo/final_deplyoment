"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Plus, Users, BookOpen, Star, TrendingUp, Edit, Eye, EyeOff, Settings } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthContext';

export function TeacherDashboard() {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const handlePublishToggle = async (course: any) => {
    const courseId = course._id || course.id;
    if (!courseId) return;
    setPublishingId(courseId);
    try {
      const newStatus = course.status === 'Published' ? 'Draft' : 'Published';
      const res = await fetch(`/api/teacher/courses/${courseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTeacherCourses((prev) =>
          prev.map((c) =>
            (c._id || c.id) === courseId ? { ...c, status: newStatus } : c
          )
        );
      }
    } catch {
      // ignore
    } finally {
      setPublishingId(null);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
    } else if (!isLoading && user && !userRole) {
      router.push('/dashboard/onboarding');
    } else if (!isLoading && user && userRole !== 'teacher') {
      router.push(`/dashboard/${userRole}`);
    }
  }, [user, userRole, isLoading, router]);

  useEffect(() => {
    if (userRole === 'teacher' && user) {
      setLoading(true);
      Promise.all([
        fetch('/api/teacher/courses').then((r) => r.json()),
        fetch('/api/teacher/stats').then((r) => r.json()),
        fetch('/api/teacher/activity').then((r) => r.json()),
      ])
        .then(([coursesRes, statsRes, activityRes]) => {
          setTeacherCourses(coursesRes.items || []);
          setStats(statsRes.error ? null : statsRes);
          setActivity(activityRes.items || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [userRole, user]);

  const handleCreateCourse = async () => {
    if (!createTitle.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: createTitle, description: createDesc }),
      });
      const data = await res.json();
      if (res.ok && data.course) {
        setTeacherCourses((prev) => [data.course, ...prev]);
        if (stats) setStats({ ...stats, activeCourses: (stats.activeCourses || 0) + 1 });
        setCreateOpen(false);
        setCreateTitle('');
        setCreateDesc('');
      } else {
        setCreateError(data.error || 'Failed to create course');
      }
    } catch {
      setCreateError('Network error');
    } finally {
      setCreating(false);
    }
  };

  if (isLoading || !user || userRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateError(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="e.g. Introduction to Web Development"
              />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Input
                id="desc"
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <p className="text-xs text-gray-500">
              New courses start as Draft (hidden from students). Publish when ready.
            </p>
            {createError && <p className="text-sm text-red-600">{createError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCourse} disabled={creating || !createTitle.trim()} className="bg-[#F59E0B] hover:bg-[#F59E0B]/90">
              {creating ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
            <p className="text-gray-600">Manage your courses and monitor student progress</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
            <Plus className="w-5 h-5 mr-2" />
            Create New Course
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.totalStudents ?? 0}</p>
                </div>
                <Users className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <p className="text-xs text-green-600 mt-2">+{stats?.newEnrollmentsThisMonth ?? 0} this month</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Courses</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.activeCourses ?? teacherCourses.length}</p>
                </div>
                <BookOpen className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Published</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.averageRating ?? '0'}</p>
                </div>
                <Star className="w-12 h-12 text-yellow-500 fill-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.completionRate ?? 0}%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">My Courses</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E3A8A]" /></div>
                ) : teacherCourses.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">No courses yet. Create your first course!</p>
                ) : (
                  <div className="space-y-4">
                    {[...teacherCourses]
                      .sort((a, b) => {
                        const sa = a.status === 'Published' ? 0 : 1;
                        const sb = b.status === 'Published' ? 0 : 1;
                        return sa - sb;
                      })
                      .map((course: any) => {
                        const isPublished = (course.status || 'Draft') === 'Published';
                        const courseId = course._id || course.id;
                        const isPublishing = publishingId === courseId;
                        return (
                          <div
                            key={courseId}
                            className={`border rounded-lg p-5 hover:shadow-md transition ${
                              !isPublished ? 'bg-gray-50 border-gray-200' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                                <p className="text-sm text-gray-600">{course.category || 'General'}</p>
                                {!isPublished && (
                                  <p className="text-xs text-amber-700 mt-1 font-medium">Hidden from students</p>
                                )}
                              </div>
                              <Badge
                                className={
                                  isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                                }
                              >
                                {isPublished ? 'Published' : 'Draft'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm text-gray-600">Students</p>
                                <p className="text-xl font-semibold text-[#1E3A8A]">{course.totalStudents ?? 0}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Rating</p>
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                                  <span className="font-semibold">{(course.rating ?? 0).toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePublishToggle(course)}
                                disabled={isPublishing}
                                className={
                                  isPublished
                                    ? 'border-gray-400 text-gray-600'
                                    : 'border-green-600 text-green-700 hover:bg-green-50'
                                }
                              >
                                {isPublishing ? (
                                  '...'
                                ) : isPublished ? (
                                  <>
                                    <EyeOff className="w-4 h-4 mr-2" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-4 h-4 mr-2" />
                                    Publish
                                  </>
                                )}
                              </Button>
                              <Link href={`/dashboard/teacher/course/${courseId}`}>
                                <Button variant="outline" size="sm" className="border-[#1E3A8A] text-[#1E3A8A]">
                                  <Settings className="w-4 h-4 mr-2" />
                                  Settings
                                </Button>
                              </Link>
                              <Link href={`/courses/${courseId}`}>
                                <Button variant="outline" size="sm" className="border-[#1E3A8A] text-[#1E3A8A]">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white mt-6">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Recent Student Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {activity.length === 0 ? (
                  <p className="text-gray-500 text-center py-6">No recent activity</p>
                ) : (
                  <div className="space-y-3">
                    {activity.slice(0, 5).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                        <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-semibold text-sm">
                          {item.initials}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">{item.message}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(item.time).toLocaleDateString()} • {new Date(item.time).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white">
              <CardHeader>
                <CardTitle className="text-xl">This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><p className="text-sm mb-1">New Enrollments</p><p className="text-3xl font-bold">+{stats?.newEnrollmentsThisMonth ?? 0}</p></div>
                <div><p className="text-sm mb-1">Completions</p><p className="text-3xl font-bold">{stats?.courseCompletionsThisMonth ?? 0}</p></div>
                <div><p className="text-sm mb-1">New Reviews</p><p className="text-3xl font-bold">{stats?.newReviewsThisMonth ?? 0}</p></div>
              </CardContent>
            </Card>
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">💡 Teaching Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2"><span className="text-green-600">✓</span>Respond to students within 24 hours</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span>Update course content regularly</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span>Engage with student reviews</li>
                  <li className="flex gap-2"><span className="text-green-600">✓</span>Add practical exercises</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
