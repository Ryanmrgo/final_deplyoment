"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { BookOpen, Award, Clock, TrendingUp } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';

export function StudentDashboard() {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
    } else if (!isLoading && user && !userRole) {
      router.push('/dashboard/onboarding');
    } else if (!isLoading && user && userRole !== 'student') {
      router.push(`/dashboard/${userRole}`);
    }
  }, [user, userRole, isLoading, router]);

  useEffect(() => {
    if (userRole === 'student' && user) {
      setLoading(true);
      Promise.all([
        fetch('/api/student/enrollments').then((r) => r.json()),
        fetch('/api/student/stats').then((r) => r.json()),
      ])
        .then(([enrollRes, statsRes]) => {
          setEnrollments(enrollRes.items || []);
          setStats(statsRes.error ? null : statsRes);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [userRole, user]);

  if (isLoading || !user || userRole !== 'student') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const myEnrolledCourses = enrollments.map((e: any) => {
    const course = e.courseId;
    const id = course?._id?.toString?.() || course?.id;
    return {
      id,
      enrollmentId: e._id,
      title: course?.title,
      category: course?.category,
      image: course?.image || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450',
      progress: e.progress ?? 0,
      completedLessons: Math.round(((e.progress || 0) / 100) * 10),
      totalLessons: 10,
      status: e.status,
    };
  });

  const displayName = user?.name || 'Student';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {displayName.split(' ')[0]}!</h1>
          <p className="text-gray-600">Continue your learning journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Courses Enrolled</p>
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.coursesEnrolled ?? myEnrolledCourses.length}</p>
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
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.coursesCompleted ?? 0}</p>
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
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.hoursLearned ?? 0}</p>
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
                  <p className="text-3xl font-bold text-[#1E3A8A]">{stats?.certificatesEarned ?? 0}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-500" />
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
                ) : myEnrolledCourses.length === 0 ? (
                  <p className="text-center text-gray-600 py-8">
                    You haven&apos;t enrolled in any courses yet.{' '}
                    <Link href="/courses" className="text-[#1E3A8A] font-semibold hover:underline">Browse courses</Link>
                  </p>
                ) : (
                  <div className="space-y-4">
                    {myEnrolledCourses.map((course: any) => (
                      <div key={course.id || course.enrollmentId} className="border rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start gap-4">
                          <img src={course.image} alt={course.title} className="w-24 h-24 object-cover rounded" />
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.title}</h3>
                                <p className="text-sm text-gray-600">{course.category || 'General'}</p>
                              </div>
                              <Badge className="bg-[#1E3A8A]">{course.progress}% Complete</Badge>
                            </div>
                            <Progress value={course.progress} className="mb-3 h-2" />
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">{course.completedLessons} / {course.totalLessons} lessons</span>
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
                )}
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

          <div className="space-y-6">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(stats?.achievements || [{ id: '0', title: 'Complete your first course!', icon: '🌟', date: '' }]).map((a: any) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-3xl">{a.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-900">{a.title}</p>
                        {a.date && <p className="text-xs text-gray-600">{a.date}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-[#F59E0B] to-[#F97316] text-white">
              <CardContent className="p-6 text-center">
                <p className="text-sm mb-2">Learning Progress</p>
                <p className="text-4xl font-bold mb-2">
                  {myEnrolledCourses.length > 0
                    ? Math.round(
                        myEnrolledCourses.reduce((s: number, c: any) => s + c.progress, 0) / myEnrolledCourses.length
                      )
                    : 0}%
                </p>
                <p className="text-sm">Average across all courses</p>
              </CardContent>
            </Card>

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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
