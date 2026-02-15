"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Star, Users, Clock, Award, BookOpen, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';

interface CourseDetailsProps {
  id: string;
}

export function CourseDetails({ id }: CourseDetailsProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [updatingProgress, setUpdatingProgress] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setCourse(data);
        setIsEnrolled(data.isEnrolled || false);
        setEnrollmentId(data.enrollmentId || null);
        setProgress(data.enrollmentProgress ?? 0);
      })
      .catch(() => setCourse(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (isLoading || !user || userRole !== 'student') return;
    setIsEnrolling(true);
    setEnrollError('');
    try {
      const res = await fetch('/api/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll');
      setIsEnrolled(true);
      setProgress(0);
    } catch (e: any) {
      setEnrollError(e.message || 'Failed to enroll');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleUpdateProgress = async (newProgress: number) => {
    if (!enrollmentId || newProgress === progress) return;
    setUpdatingProgress(true);
    try {
      const res = await fetch(`/api/student/enrollments/${enrollmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });
      if (res.ok) setProgress(newProgress);
    } finally {
      setUpdatingProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E3A8A]" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
          <Link href="/courses">
            <Button className="bg-[#F59E0B] hover:bg-[#F59E0B]/90">Browse Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const averageRating = course.rating ?? 0;
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 !== 0;
  const syllabus = course.syllabus || [];
  const reviews = course.reviews || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-[#1E3A8A] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/courses" className="hover:text-[#F59E0B] transition">Courses</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-300">{course.category}</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
          <p className="text-xl text-gray-200 mb-6">{course.description}</p>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(fullStars)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
                {hasHalfStar && <Star className="w-5 h-5 fill-[#F59E0B]/50 text-[#F59E0B]" />}
                {[...Array(5 - Math.ceil(averageRating))].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-gray-400" />
                ))}
              </div>
              <span className="font-semibold">{averageRating.toFixed(1)}</span>
              <span className="text-gray-300">({course.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{course.students} students enrolled</span>
            </div>
            <Badge className="bg-[#F59E0B] text-white text-sm">{course.level}</Badge>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">What You&apos;ll Learn</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{course.description}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  {['Master the fundamentals', 'Build real-world projects', 'Hands-on practice', 'Certificate of completion'].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 flex-shrink-0">
                        <span className="text-green-600 text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {syllabus.length > 0 && (
              <Card className="bg-white">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900">Course Syllabus</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {syllabus.map((section: any, index: number) => (
                      <AccordionItem key={index} value={`section-${index}`}>
                        <AccordionTrigger className="text-left hover:text-[#1E3A8A]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-sm font-semibold">
                              {index + 1}
                            </div>
                            <span className="font-semibold">{section.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <ul className="ml-11 mt-2 space-y-2">
                            {(section.lessons || []).map((lesson: string, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-gray-700">
                                <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                                <span>{lesson}</span>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            )}

            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Instructor</h2>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-2xl bg-[#1E3A8A] text-white">{course.instructor?.avatar || '👩‍🏫'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold mb-1 text-gray-900">{course.instructor?.name || 'Instructor'}</h3>
                    <p className="text-gray-600">{course.instructor?.bio || 'Expert instructor'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Student Reviews</h2>
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="border-b pb-6 last:border-b-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarFallback className="bg-[#1E3A8A] text-white">{review.student?.charAt(0) || 'S'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{review.student || 'Student'}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(review.rating || 0)].map((_, i) => (
                                  <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">{review.date}</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 bg-white shadow-xl">
              <div className="relative h-48 overflow-hidden rounded-t-lg">
                <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-[#1E3A8A] mb-2">FREE</p>
                  <p className="text-gray-600">100% Free, No Hidden Costs</p>
                </div>

                {userRole === 'student' ? (
                  <>
                    {isEnrolled ? (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">Your Progress</span>
                          <span className="text-sm font-bold text-[#1E3A8A]">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-3 mb-4" />
                        <div className="flex flex-wrap gap-2">
                          {[25, 50, 75, 100].map((p) => (
                            <Button
                              key={p}
                              variant={progress >= p ? 'default' : 'outline'}
                              size="sm"
                              disabled={updatingProgress}
                              onClick={() => handleUpdateProgress(p)}
                              className={progress >= p ? 'bg-green-600' : ''}
                            >
                              {p}%
                            </Button>
                          ))}
                        </div>
                        {progress >= 100 && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="text-green-800 font-semibold text-center">Course Completed!</p>
                            <p className="text-green-600 text-sm text-center">Certificate earned</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <Button
                          onClick={handleEnroll}
                          disabled={isEnrolling}
                          className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-6 text-lg mb-4"
                        >
                          {isEnrolling ? 'Enrolling...' : "Enroll Now - It's Free!"}
                        </Button>
                        {enrollError && <p className="text-red-600 text-sm text-center mb-2">{enrollError}</p>}
                      </>
                    )}
                  </>
                ) : userRole === 'teacher' ? (
                  <div className="w-full space-y-3 mb-4">
                    <div className="border-2 border-blue-200 bg-blue-50 rounded-lg py-4 px-4">
                      <p className="text-blue-800 font-semibold mb-1">👨‍🏫 Teacher View</p>
                      <p className="text-sm text-blue-700">
                        {course.status === 'Draft'
                          ? 'This course is hidden from students. Publish it when ready.'
                          : 'This course is visible to students.'}
                      </p>
                    </div>
                    <Link href={`/dashboard/teacher/course/${id}`}>
                      <Button variant="outline" className="w-full border-blue-600 text-blue-700">
                        Edit course settings
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Link href="/auth/sign-in">
                    <Button className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-6 text-lg mb-4">
                      Sign In to Enroll
                    </Button>
                  </Link>
                )}

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2"><Clock className="w-5 h-5" />Duration</span>
                    <span className="font-semibold">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2"><Award className="w-5 h-5" />Level</span>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2"><Users className="w-5 h-5" />Students</span>
                    <span className="font-semibold">{course.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2"><BookOpen className="w-5 h-5" />Category</span>
                    <Badge className="bg-[#1E3A8A]">{course.category}</Badge>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3 text-gray-900">This course includes:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {['Lifetime access', 'Certificate of completion', 'Downloadable resources', 'Community support'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
