"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Users, BookOpen, TrendingUp, UserCheck, Eye, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/app/components/AuthContext';

export function AdminDashboard() {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      ])
        .then(([statsRes, usersRes, coursesRes]) => {
          setStats(statsRes.error ? null : statsRes);
          setUsers(usersRes.items || []);
          setCourses(coursesRes.items || []);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [userRole, user]);

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
                            <Link href={`/courses/${course.id}`}>
                              <Button variant="outline" size="sm" className="border-[#1E3A8A] text-[#1E3A8A]">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
