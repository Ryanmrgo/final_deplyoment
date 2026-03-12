"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { TrendingUp, Users, Star, BookOpen } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';
import { useRouter } from 'next/navigation';

type AnalyticsCourse = {
  id: string;
  title: string;
  category: string;
  students: number;
  rating: number;
  reviewCount: number;
  status: string;
};

export function TeacherAnalytics() {
  const { userRole, user, isLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<AnalyticsCourse[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
    }
    if (!isLoading && user && userRole && userRole !== 'teacher') {
      router.push(`/dashboard/${userRole}`);
    }
  }, [isLoading, user, userRole, router]);

  useEffect(() => {
    if (isLoading || !user || userRole !== 'teacher') return;

    setLoading(true);
    Promise.all([
      fetch('/api/teacher/courses').then((r) => (r.ok ? r.json() : { items: [] })),
      fetch('/api/teacher/stats').then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([coursesRes, statsRes]) => {
        const mappedCourses = (coursesRes.items || []).map((course: any) => ({
          id: String(course._id || course.id),
          title: String(course.title || ''),
          category: String(course.category || 'General'),
          students: Number(course.totalStudents || 0),
          rating: Number(course.rating || 0),
          reviewCount: Array.isArray(course.reviews) ? course.reviews.length : 0,
          status: String(course.status || 'Draft'),
        }));
        setCourses(mappedCourses);
        setStats(statsRes);
      })
      .catch(() => {
        setCourses([]);
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, [isLoading, user, userRole]);

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

  const totalStudents = useMemo(
    () => courses.reduce((sum, course) => sum + course.students, 0),
    [courses]
  );
  const averageRating = useMemo(
    () =>
      courses.length
        ? (courses.reduce((sum, course) => sum + course.rating, 0) / courses.length).toFixed(2)
        : '0.00',
    [courses]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Analytics</h1>
            <p className="text-gray-600">Track enrollment, ratings, and course performance.</p>
          </div>
          <Badge className="bg-[#1E3A8A] text-white">{courses.length} courses</Badge>
        </div>

        {loading ? <p className="mb-6 text-sm text-gray-600">Loading analytics...</p> : null}

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
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.activeCourses ?? courses.filter((course) => course.status === 'Published').length}</p>
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
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.newEnrollmentsThisMonth ?? 0}</p>
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
            {courses.map((course) => (
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
