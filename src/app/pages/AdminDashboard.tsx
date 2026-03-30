"use client";

import { useAuth } from '@/app/components/AuthContext';
import { ConfirmDialog } from '@/app/components/confirm-dialog';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { BookOpen, CheckCircle, Eye, TrendingUp, UserCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function AdminDashboard() {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [discussions, setDiscussions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingCourseId, setUpdatingCourseId] = useState<string | null>(null);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [deletingDiscussionId, setDeletingDiscussionId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📚');

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    onConfirm: () => void;
    title?: string;
    description?: string;
  }>({
    open: false,
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
    } else if (!isLoading && user && userRole !== 'admin') {
      router.push(`/dashboard/${userRole || 'onboarding'}`);
    }
  }, [user, userRole, isLoading, router]);

  useEffect(() => {
    if (userRole === 'admin' && user) {
      setLoading(true);
      Promise.all([
        fetch('/api/admin/stats').then((r) => r.json()),
        fetch('/api/admin/users').then((r) => r.json()),
        fetch('/api/admin/courses').then((r) => r.json()),
        fetch('/api/admin/reviews').then((r) => r.json()),
        fetch('/api/admin/discussions').then((r) => r.json()),
        fetch('/api/admin/categories').then((r) => r.json()),
      ])
        .then(([statsRes, usersRes, coursesRes, reviewsRes, discussionsRes, categoriesRes]) => {
          setStats(statsRes.error ? null : statsRes);
          setUsers(usersRes.items || []);
          setCourses(coursesRes.items || []);
          setReviews(reviewsRes.items || []);
          setDiscussions(discussionsRes.items || []);
          setCategories(categoriesRes.items || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [userRole, user]);

  const handleUpdateUserRole = async (targetUserId: string, role: 'student' | 'teacher' | 'admin') => {
    const previousUsers = users;
    setUsers((prev) => prev.map((item) => (item.id === targetUserId ? { ...item, role } : item)));
    setUpdatingUserId(targetUserId);
    setAdminMessage(null);
    const toastId = toast.loading('Updating user role...');
    try {
      const res = await fetch(`/api/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update user role');

      setAdminMessage('User role updated successfully.');
      toast.success('User role updated.', { id: toastId });
    } catch (error: any) {
      setUsers(previousUsers);
      setAdminMessage(error?.message || 'Failed to update user role.');
      toast.error(error?.message || 'Failed to update user role.', { id: toastId });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleUpdateCourseStatus = async (courseId: string, status: 'Draft' | 'Published' | 'Archived') => {
    const previousCourses = courses;
    setCourses((prev) => prev.map((item) => (item.id === courseId ? { ...item, status } : item)));
    setUpdatingCourseId(courseId);
    setAdminMessage(null);
    const toastId = toast.loading('Updating course status...');
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update course status');

      setAdminMessage('Course status updated successfully.');
      toast.success('Course status updated.', { id: toastId });
    } catch (error: any) {
      setCourses(previousCourses);
      setAdminMessage(error?.message || 'Failed to update course status.');
      toast.error(error?.message || 'Failed to update course status.', { id: toastId });
    } finally {
      setUpdatingCourseId(null);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    // No window.confirm here – it's already confirmed by the dialog
    const previousCourses = courses;
    setCourses((prev) => prev.filter((item) => item.id !== courseId));
    setDeletingCourseId(courseId);
    setAdminMessage(null);
    const toastId = toast.loading('Deleting course...');
    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete course');

      setAdminMessage('Course deleted successfully.');
      toast.success('Course deleted.', { id: toastId });
    } catch (error: any) {
      setCourses(previousCourses);
      setAdminMessage(error?.message || 'Failed to delete course.');
      toast.error(error?.message || 'Failed to delete course.', { id: toastId });
    } finally {
      setDeletingCourseId(null);
    }
  };

  const handleDeleteReview = async (courseId: string, studentId: string) => {
    const reviewId = `${courseId}-${studentId}`;
    const previousReviews = reviews;
    setReviews((prev) => prev.filter((item) => !(item.courseId === courseId && item.studentId === studentId)));
    setDeletingReviewId(reviewId);
    setAdminMessage(null);
    const toastId = toast.loading('Removing review...');
    try {
      const res = await fetch(`/api/admin/reviews/${courseId}/${studentId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete review');

      setAdminMessage('Review removed successfully.');
      toast.success('Review removed.', { id: toastId });
    } catch (error: any) {
      setReviews(previousReviews);
      setAdminMessage(error?.message || 'Failed to delete review.');
      toast.error(error?.message || 'Failed to delete review.', { id: toastId });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    const previousDiscussions = discussions;
    setDiscussions((prev) => prev.filter((item) => item.id !== discussionId));
    setDeletingDiscussionId(discussionId);
    setAdminMessage(null);
    const toastId = toast.loading('Removing discussion...');
    try {
      const res = await fetch(`/api/admin/discussions/${discussionId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete discussion');

      setAdminMessage('Discussion removed successfully.');
      toast.success('Discussion removed.', { id: toastId });
    } catch (error: any) {
      setDiscussions(previousDiscussions);
      setAdminMessage(error?.message || 'Failed to delete discussion.');
      toast.error(error?.message || 'Failed to delete discussion.', { id: toastId });
    } finally {
      setDeletingDiscussionId(null);
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      setAdminMessage('Category name is required.');
      return;
    }

    const tempCategory = {
      _id: `temp-${Date.now()}`,
      name,
      icon: newCategoryIcon || '📚',
      isActive: true,
    };
    const previousCategories = categories;
    setCategories((prev) => [tempCategory, ...prev]);
    setNewCategoryName('');
    setNewCategoryIcon('📚');

    setAdminMessage(null);
    const toastId = toast.loading('Creating category...');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon: newCategoryIcon || '📚' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create category');

      setCategories((prev) => [data.category, ...prev.filter((item) => String(item._id) !== tempCategory._id)]);
      setAdminMessage('Category created successfully.');
      toast.success('Category created.', { id: toastId });
    } catch (error: any) {
      setCategories(previousCategories);
      setAdminMessage(error?.message || 'Failed to create category.');
      toast.error(error?.message || 'Failed to create category.', { id: toastId });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const previousCategories = categories;
    setCategories((prev) => prev.filter((item) => String(item._id) !== categoryId));
    setAdminMessage(null);
    const toastId = toast.loading('Deleting category...');
    try {
      const res = await fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete category');

      setAdminMessage('Category deleted successfully.');
      toast.success('Category deleted.', { id: toastId });
    } catch (error: any) {
      setCategories(previousCategories);
      setAdminMessage(error?.message || 'Failed to delete category.');
      toast.error(error?.message || 'Failed to delete category.', { id: toastId });
    }
  };

  if (isLoading || !user || userRole !== 'admin') {
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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, courses, and platform settings</p>
          {adminMessage ? <p className="mt-2 text-sm text-gray-700">{adminMessage}</p> : null}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.totalUsers ?? 0}</p>
                </div>
                <Users className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <p className="text-xs text-green-600 mt-2">+{stats?.newUsersThisMonth ?? 0} this month</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.totalCourses ?? 0}</p>
                </div>
                <BookOpen className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">{stats?.activeCourses ?? 0} active</p>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Enrollments</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.totalEnrollments ?? 0}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
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
                <UserCheck className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white">
              Users Management
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white">
              Courses Management
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white">
              Reviews Moderation
            </TabsTrigger>
            <TabsTrigger value="discussions" className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white">
              Discussions Moderation
            </TabsTrigger>
            <TabsTrigger value="categories" className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white">
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E3A8A]" /></div>
                ) : users.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No users found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Role</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Joined</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{u.name}</td>
                            <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                            <td className="py-3 px-4">
                              <Badge variant="outline" className={u.role === 'teacher' ? 'border-[#F59E0B] text-[#F59E0B]' : ''}>
                                {u.role}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{u.joined}</td>
                            <td className="py-3 px-4">
                              <select
                                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                                value={u.role}
                                disabled={updatingUserId === u.id}
                                onChange={(e) =>
                                  handleUpdateUserRole(
                                    u.id,
                                    e.target.value as 'student' | 'teacher' | 'admin'
                                  )
                                }
                              >
                                <option value="student">student</option>
                                <option value="teacher">teacher</option>
                                <option value="admin">admin</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="courses">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Courses Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1E3A8A]" /></div>
                ) : courses.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No courses found</p>
                ) : (
                  <div className="space-y-4">
                    {courses.map((course) => (
                      <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            <img src={course.image} alt={course.title} className="w-20 h-20 object-cover rounded" />
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">By {course.instructorName}</p>
                              <div className="flex gap-2">
                                <Badge className="bg-[#1E3A8A]">{course.category}</Badge>
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {course.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{course.totalStudents} students</span>
                            <select
                              className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                              value={course.status}
                              disabled={updatingCourseId === course.id}
                              onChange={(e) =>
                                handleUpdateCourseStatus(
                                  course.id,
                                  e.target.value as 'Draft' | 'Published' | 'Archived'
                                )
                              }
                            >
                              <option value="Draft">Draft</option>
                              <option value="Published">Published</option>
                              <option value="Archived">Archived</option>
                            </select>
                            <Link href={`/courses/${course.id}`}>
                              <Button variant="outline" size="sm" className="border-[#1E3A8A] text-[#1E3A8A]">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600"
                              disabled={deletingCourseId === course.id}
                              onClick={() => {
                                setConfirmDialog({
                                  open: true,
                                  title: "Delete Course",
                                  description: `Delete "${course.title}" and all related data? This action cannot be undone.`,
                                  onConfirm: () => handleDeleteCourse(course.id),
                                });
                              }}
                            >
                              {deletingCourseId === course.id ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Reviews Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-sm text-gray-600">No reviews available.</p>
                ) : (
                  <div className="space-y-3">
                    {reviews.map((review) => {
                      const reviewId = `${review.courseId}-${review.studentId}`;
                      return (
                        <div key={reviewId} className="border rounded-lg p-3">
                          <p className="font-semibold text-gray-900">{review.courseTitle}</p>
                          <p className="text-sm text-gray-600">By {review.studentName} • {review.rating}/5</p>
                          <p className="text-sm text-gray-700 mt-1">{review.comment}</p>
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-300 text-red-600"
                              disabled={deletingReviewId === reviewId}
                              onClick={() => handleDeleteReview(review.courseId, review.studentId)}
                            >
                              {deletingReviewId === reviewId ? 'Removing...' : 'Remove Review'}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussions">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Discussions Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                {discussions.length === 0 ? (
                  <p className="text-sm text-gray-600">No discussions available.</p>
                ) : (
                  <div className="space-y-3">
                    {discussions.map((discussion) => (
                      <div key={discussion.id} className="border rounded-lg p-3">
                        <p className="font-semibold text-gray-900">{discussion.courseTitle}</p>
                        <p className="text-sm text-gray-600">By {discussion.studentName}</p>
                        <p className="text-sm text-gray-700 mt-1">{discussion.question}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className={discussion.resolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                            {discussion.resolved ? 'Resolved' : 'Open'}
                          </Badge>
                          <span className="text-xs text-gray-500">{discussion.repliesCount} replies</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto border-red-300 text-red-600"
                            disabled={deletingDiscussionId === discussion.id}
                            onClick={() => handleDeleteDiscussion(discussion.id)}
                          >
                            {deletingDiscussionId === discussion.id ? 'Removing...' : 'Remove'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">Category Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                  />
                  <input
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Icon (emoji)"
                    value={newCategoryIcon}
                    onChange={(e) => setNewCategoryIcon(e.target.value)}
                  />
                  <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleCreateCategory}>
                    Add Category
                  </Button>
                </div>

                {categories.length === 0 ? (
                  <p className="text-sm text-gray-600">No categories found.</p>
                ) : (
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={String(category._id)} className="flex items-center justify-between rounded-md border p-3">
                        <div className="flex items-center gap-2">
                          <span>{category.icon || '📚'}</span>
                          <span className="font-medium text-gray-900">{category.name}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-600"
                          onClick={() => handleDeleteCategory(String(category._id))}
                        >
                          Delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <ConfirmDialog
          open={confirmDialog.open}
          onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
          onConfirm={() => {
            confirmDialog.onConfirm();
            setConfirmDialog((prev) => ({ ...prev, open: false }));
          }}
          title={confirmDialog.title}
          description={confirmDialog.description}
        />
      </div>
    </div>
  );
}
