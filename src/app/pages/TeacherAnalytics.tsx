"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { TrendingUp, Users, Star, BookOpen } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';
import { useCourses } from '@/app/components/CoursesContext';
import { teacherCourses } from '@/app/data/mockData';

type AnalyticsCourse = {
  id: string;
  title: string;
  category: string;
  students: number;
  rating: number;
  reviewCount: number;
};

export function TeacherAnalytics() {
  const { userRole } = useAuth();
  const { createdCourses } = useCourses();

  const analyticsCourses: AnalyticsCourse[] = [
    ...teacherCourses.map((course) => ({
      id: course.id,
      title: course.title,
      category: course.category,
      students: 'students' in course ? course.students : course.enrolledStudents ?? 0,
      rating: 'rating' in course ? course.rating : course.averageRating ?? 0,
      reviewCount: 'reviewCount' in course ? course.reviewCount : 0,
    })),
    ...createdCourses.map((course) => ({
      id: course.id,
      title: course.title,
      category: course.category,
      students: course.students ?? 0,
      rating: course.rating ?? 0,
      reviewCount: course.reviewCount ?? 0,
    })),
  ];

  if (userRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Teacher access only</h2>
          <p className="text-gray-600 mb-6">Please sign in as a teacher to view analytics.</p>
          <Link href="/login">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalStudents = analyticsCourses.reduce((sum, course) => sum + course.students, 0);
  const averageRating = analyticsCourses.length
    ? (analyticsCourses.reduce((sum, course) => sum + course.rating, 0) / analyticsCourses.length).toFixed(2)
    : '0.00';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Analytics</h1>
            <p className="text-gray-600">Track enrollment, ratings, and course performance.</p>
          </div>
          <Badge className="bg-[#1E3A8A] text-white">{analyticsCourses.length} courses</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{totalStudents}</p>
                </div>
                <Users className="w-12 h-12 text-[#F59E0B]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Rating</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{averageRating}</p>
                </div>
                <Star className="w-12 h-12 text-yellow-500 fill-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Courses</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{analyticsCourses.length}</p>
                </div>
                <BookOpen className="w-12 h-12 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Growth</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">+12%</p>
                </div>
                <TrendingUp className="w-12 h-12 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Course Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analyticsCourses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{course.title}</p>
                    <p className="text-sm text-gray-600">{course.category}</p>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span><strong className="text-gray-900">{course.students}</strong> students</span>
                    <span><strong className="text-gray-900">{course.rating.toFixed(1)}</strong> rating</span>
                    <span><strong className="text-gray-900">{course.reviewCount}</strong> reviews</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6">
          <Link href="/dashboard/teacher">
            <Button variant="outline" className="border-[#1E3A8A] text-[#1E3A8A]">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
