"use client";

import { useAuth } from '@/app/components/AuthContext';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { achievements, courses, enrolledCourses, stats } from '@/app/data/mockData';
import { EnrolledCourse } from '@/app/types'; // ADD THIS IMPORT
import { Award, BookOpen, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export function StudentDashboard() {
  const { userRole } = useAuth();
  if (userRole !== 'student') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Student access only</h2>
          <p className="text-gray-600 mb-6">Please sign in as a student to view this dashboard.</p>
          <Link href="/login">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const myEnrolledCourses: EnrolledCourse[] = enrolledCourses.map((enrolled) => {
    const course = courses.find((c) => c.id === enrolled.courseId);
    return { ...course!, ...enrolled }; // Using ! because we know it exists
  }).filter((course): course is EnrolledCourse => course !== undefined);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, Student!</h1>
          <p className="text-gray-600">Continue your learning journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Courses Enrolled</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.student.coursesEnrolled}</p>
                </div>
                <BookOpen className="w-12 h-12 text-[#F59E0B]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.student.coursesCompleted}</p>
                </div>
                <Award className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hours Learned</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.student.hoursLearned}</p>
                </div>
                <Clock className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Certificates</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats.student.certificatesEarned}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Courses */}
          <div className="lg:col-span-2">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">My Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myEnrolledCourses.map((course: EnrolledCourse) => (
                    <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start gap-4">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                              <p className="text-sm text-gray-600">{course.category}</p>
                            </div>
                            <Badge className="bg-[#1E3A8A]">{course.progress}% Complete</Badge>
                          </div>
                          <Progress value={course.progress} className="mb-3 h-2" />
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              {course.completedLessons} / {course.totalLessons} lessons completed
                            </div>
                            <Link href={`/courses/${course.id}`}>
                              <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">
                                Continue Learning
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <Link href="/courses">
                    <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                      Browse More Courses
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Achievements & Progress */}
          <div className="space-y-6">
            {/* Achievements */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-3xl">{achievement.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{achievement.title}</p>
                        <p className="text-xs text-gray-600">{achievement.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Learning Streak */}
            <Card className="bg-gradient-to-br from-[#F59E0B] to-[#F97316] text-white">
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-sm mb-2">Learning Streak</p>
                  <p className="text-5xl font-bold mb-2">7</p>
                  <p className="text-sm">Days in a row!</p>
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs">Keep it up! You're doing great!</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/courses">
                  <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white">
                    Explore New Courses
                  </Button>
                </Link>
                <Button variant="outline" className="w-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                  View Certificates
                </Button>
                <Button variant="outline" className="w-full border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white">
                  Download Progress Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}