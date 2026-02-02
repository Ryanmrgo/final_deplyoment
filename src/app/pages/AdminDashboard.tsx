"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Users, BookOpen, TrendingUp, UserCheck, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';
import { stats, courses } from '@/app/data/mockData';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthContext';

export function AdminDashboard() {
  const { userRole } = useAuth();
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Admin access only</h2>
          <p className="text-gray-600 mb-6">Please sign in as an admin to view this dashboard.</p>
          <Link href="/login">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const recentUsers = [
    { id: '1', name: 'Ahmed Ali', email: 'ahmed@example.com', role: 'Student', status: 'Active', joined: '2026-01-14' },
    { id: '2', name: 'Fatima Hassan', email: 'fatima@example.com', role: 'Student', status: 'Active', joined: '2026-01-13' },
    { id: '3', name: 'Dr. Sarah Johnson', email: 'sarah@example.com', role: 'Teacher', status: 'Active', joined: '2026-01-10' },
    { id: '4', name: 'Omar Khalil', email: 'omar@example.com', role: 'Student', status: 'Active', joined: '2026-01-12' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, courses, and platform settings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.admin.totalUsers}</p>
                </div>
                <Users className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <p className="text-xs text-green-600 mt-2">+{stats.admin.newUsersThisMonth} this month</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Courses</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.admin.totalCourses}</p>
                </div>
                <BookOpen className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">{stats.admin.activeCourses} active</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Courses</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.admin.activeCourses}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-xs text-green-600 mt-2">77% of total</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">New This Month</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.admin.newUsersThisMonth}</p>
                </div>
                <UserCheck className="w-12 h-12 text-purple-500" />
              </div>
              <p className="text-xs text-green-600 mt-2">+15% growth</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-white p-1">
            <TabsTrigger value="users" className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white">
              Users Management
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white">
              Courses Management
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white">
              Reports & Analytics
            </TabsTrigger>
          </TabsList>

          {/* Users Management */}
          <TabsContent value="users">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-gray-900">User Management</CardTitle>
                  <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
                    Add New User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Email</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Joined</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm text-gray-900">{user.name}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className={user.role === 'Teacher' ? 'border-[#F59E0B] text-[#F59E0B]' : ''}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">{user.joined}</td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Courses Management */}
          <TabsContent value="courses">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-gray-900">Courses Management</CardTitle>
                  <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
                    Approve Pending Courses
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.slice(0, 5).map((course) => (
                    <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <img src={course.image} alt={course.title} className="w-20 h-20 object-cover rounded" />
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">By {course.instructor.name}</p>
                            <div className="flex gap-2">
                              <Badge className="bg-[#1E3A8A]">{course.category}</Badge>
                              <Badge className="bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Approved
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="border-[#1E3A8A] text-[#1E3A8A]">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button variant="outline" size="sm" className="border-[#1E3A8A] text-[#1E3A8A]">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                            <XCircle className="w-4 h-4 mr-2" />
                            Suspend
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports & Analytics */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">User Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">This Month</p>
                      <p className="text-2xl font-bold text-[#1E3A8A]">{stats.admin.newUsersThisMonth}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Month</p>
                      <p className="text-2xl font-bold text-gray-900">203</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Growth</p>
                      <p className="text-2xl font-bold text-green-600">+15%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Course Enrollment Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                    <p className="text-gray-500">Chart visualization would go here</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Enrollments</p>
                      <p className="text-2xl font-bold text-[#1E3A8A]">3,420</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">This Week</p>
                      <p className="text-2xl font-bold text-gray-900">127</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completion</p>
                      <p className="text-2xl font-bold text-green-600">68%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">Top Performing Courses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {courses.slice(0, 3).map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#F59E0B] text-white flex items-center justify-center font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{course.title}</p>
                            <p className="text-sm text-gray-600">{course.students} students</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-gray-900">{course.rating}</span>
                            <span className="text-yellow-500">★</span>
                          </div>
                          <p className="text-xs text-gray-600">{course.reviewCount} reviews</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
