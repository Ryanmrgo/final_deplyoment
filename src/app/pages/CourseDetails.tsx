"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Star, Users, Clock, Award, BookOpen, ChevronRight, CheckCircle } from 'lucide-react';
import { courses } from '@/app/data/mockData';
import { useAuth } from '@/app/components/AuthContext';

interface CourseDetailsProps {
  id: string;
}

export function CourseDetails({ id }: CourseDetailsProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  
  const course = courses.find((c) => c.id === id);

  const handleEnroll = async () => {
    if (!course) return;

    if (isLoading) return;

    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    if (userRole !== 'student') {
      setEnrollError('Only students can enroll in courses');
      return;
    }

    setIsEnrolling(true);
    setEnrollError('');

    try {
      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll');
      }

      setIsEnrolled(true);
    } catch (error: any) {
      setEnrollError(error.message || 'Failed to enroll in course');
    } finally {
      setIsEnrolling(false);
    }
  };

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

  const averageRating = course.rating;
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 !== 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="bg-[#1E3A8A] text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <Link href="/courses" className="hover:text-[#F59E0B] transition">
              Courses
            </Link>
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Course Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Overview */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">What You'll Learn</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{course.description}</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 flex-shrink-0">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <span className="text-gray-700">Master the fundamentals and core concepts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 flex-shrink-0">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <span className="text-gray-700">Build real-world projects from scratch</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 flex-shrink-0">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <span className="text-gray-700">Get hands-on practice and exercises</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-1 flex-shrink-0">
                      <span className="text-green-600 text-sm">✓</span>
                    </div>
                    <span className="text-gray-700">Earn a certificate upon completion</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Syllabus */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Course Syllabus</h2>
                <Accordion type="single" collapsible className="w-full">
                  {course.syllabus.map((section, index) => (
                    <AccordionItem key={section.id} value={`section-${index}`}>
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
                          {section.lessons.map((lesson, lessonIndex) => (
                            <li key={lessonIndex} className="flex items-center gap-2 text-gray-700">
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

            {/* Instructor */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Instructor</h2>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarFallback className="text-2xl bg-[#1E3A8A] text-white">
                      {course.instructor.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold mb-1 text-gray-900">{course.instructor.name}</h3>
                    <p className="text-gray-600">{course.instructor.bio}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="bg-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6 text-gray-900">Student Reviews</h2>
                {course.reviews.length > 0 ? (
                  <div className="space-y-6">
                    {course.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-6 last:border-b-0">
                        <div className="flex items-center gap-3 mb-3">
                          <Avatar>
                            <AvatarFallback className="bg-[#1E3A8A] text-white">
                              {review.student.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-gray-900">{review.student}</p>
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {[...Array(review.rating)].map((_, i) => (
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
                  <p className="text-gray-600 text-center py-8">No reviews yet. Be the first to review this course!</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Course Info Card */}
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
                      <div className="w-full border-2 border-green-200 bg-green-50 rounded-lg py-6 text-center mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <p className="text-green-800 font-semibold">
                          ✅ You're Enrolled!
                        </p>
                        <p className="text-green-600 text-sm mt-1">
                          Start learning now
                        </p>
                      </div>
                    ) : (
                      <>
                        <Button 
                          onClick={handleEnroll}
                          disabled={isEnrolling}
                          className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-6 text-lg mb-4"
                        >
                          {isEnrolling ? 'Enrolling...' : 'Enroll Now - It\'s Free!'}
                        </Button>
                        {enrollError && (
                          <p className="text-red-600 text-sm text-center mb-2">
                            {enrollError}
                          </p>
                        )}
                      </>
                    )}
                  </>
                ) : userRole === 'teacher' ? (
                  <div className="w-full border-2 border-blue-200 bg-blue-50 rounded-lg py-6 text-center mb-4">
                    <p className="text-blue-800 font-semibold">
                      👨‍🏫 Teacher View Only
                    </p>
                    <p className="text-blue-600 text-sm mt-1">
                      Teachers cannot enroll in courses
                    </p>
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
                    <span className="text-gray-600 flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Duration
                    </span>
                    <span className="font-semibold text-gray-900">{course.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Level
                    </span>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Students
                    </span>
                    <span className="font-semibold text-gray-900">{course.students}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Category
                    </span>
                    <Badge className="bg-[#1E3A8A]">{course.category}</Badge>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3 text-gray-900">This course includes:</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Lifetime access to all content
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Certificate of completion
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Downloadable resources
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      Community support
                    </li>
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
