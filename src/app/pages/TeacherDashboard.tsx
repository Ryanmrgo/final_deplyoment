"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Plus, Users, BookOpen, Star, TrendingUp, Edit, Eye } from 'lucide-react';
import { teacherCourses, stats } from '@/app/data/mockData';
import Link from 'next/link';
import { useAuth } from '@/app/components/AuthContext';

export function TeacherDashboard() {
  const { userRole } = useAuth();
  if (userRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Teacher access only</h2>
          <p className="text-gray-600 mb-6">Please sign in as a teacher to view this dashboard.</p>
          <Link href="/login">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Dashboard</h1>
            <p className="text-gray-600">Manage your courses and monitor student progress</p>
          </div>
          <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
            <Plus className="w-5 h-5 mr-2" />
            Create New Course
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.teacher.totalStudents}</p>
                </div>
                <Users className="w-12 h-12 text-[#F59E0B]" />
              </div>
              <p className="text-xs text-green-600 mt-2">+124 this month</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Courses</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.teacher.activeCourses}</p>
                </div>
                <BookOpen className="w-12 h-12 text-blue-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">All published</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Rating</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.teacher.averageRating}</p>
                </div>
                <Star className="w-12 h-12 text-yellow-500 fill-yellow-500" />
              </div>
              <p className="text-xs text-green-600 mt-2">Excellent feedback</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">70%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-xs text-green-600 mt-2">+5% from last month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <Card className="bg-white">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-gray-900">My Courses</CardTitle>
                  <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A]">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teacherCourses.map((course) => (
                    <div key={course.id} className="border rounded-lg p-5 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                          <p className="text-sm text-gray-600">{course.category}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Published</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Students</p>
                          <p className="text-xl font-semibold text-[#1E3A8A]">{course.enrolledStudents}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Completion</p>
                          <p className="text-xl font-semibold text-[#1E3A8A]">{course.completionRate}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Rating</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <p className="text-xl font-semibold text-[#1E3A8A]">{course.averageRating}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Course
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                          <Eye className="w-4 h-4 mr-2" />
                          View Analytics
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white mt-6">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Recent Student Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <div className="w-10 h-10 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-semibold">
                      AS
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Ahmed Said completed "JavaScript Essentials"</p>
                      <p className="text-xs text-gray-600">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <div className="w-10 h-10 rounded-full bg-[#F59E0B] text-white flex items-center justify-center font-semibold">
                      FH
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Fatima Hassan enrolled in your course</p>
                      <p className="text-xs text-gray-600">5 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold">
                      OK
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Omar Khalil left a 5-star review</p>
                      <p className="text-xs text-gray-600">1 day ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Course
                </Button>
                <Button variant="outline" className="w-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                  Manage Students
                </Button>
                <Button variant="outline" className="w-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                  View All Reviews
                </Button>
                <Button variant="outline" className="w-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                  Course Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Performance Insights */}
            <Card className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white">
              <CardHeader>
                <CardTitle className="text-xl">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm mb-1">New Enrollments</p>
                    <p className="text-3xl font-bold">+124</p>
                  </div>
                  <div>
                    <p className="text-sm mb-1">Course Completions</p>
                    <p className="text-3xl font-bold">89</p>
                  </div>
                  <div>
                    <p className="text-sm mb-1">New Reviews</p>
                    <p className="text-3xl font-bold">32</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">💡 Teaching Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Respond to student questions within 24 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Update course content regularly</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Engage with student reviews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 mt-1">✓</span>
                    <span>Add practical exercises and projects</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
