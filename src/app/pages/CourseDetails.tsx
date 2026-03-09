"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/app/components/AuthContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/app/components/ui/accordion';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { courses } from '@/app/data/mockData';
import { BookOpen, CheckCircle, Clock, Star, Users } from 'lucide-react';

interface CourseDetailsProps {
  id: string;
}

export function CourseDetails({ id }: CourseDetailsProps) {
  const { user, userRole, isLoading } = useAuth();
  const router = useRouter();
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState('');

  const course = courses.find((item) => item.id === id);

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Course not found</h1>
          <Link href="/courses">
            <Button>Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleEnroll = async () => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    if (userRole !== 'student') {
      setError('Only students can enroll in courses.');
      return;
    }

    try {
      setError('');
      setIsEnrolling(true);

      const response = await fetch('/api/enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId: course.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to enroll in course');
      }

      setIsEnrolled(true);
    } catch (enrollError) {
      console.error('Enroll error:', enrollError);
      setError('Failed to enroll. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <Badge className="mb-3 bg-[#1E3A8A]">{course.category}</Badge>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{course.title}</h1>
            <p className="text-slate-600">{course.description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 text-center"><Users className="w-5 h-5 mx-auto mb-1" />{course.students}</CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Star className="w-5 h-5 mx-auto mb-1" />{course.rating}</CardContent></Card>
            <Card><CardContent className="p-4 text-center"><Clock className="w-5 h-5 mx-auto mb-1" />{course.duration}</CardContent></Card>
            <Card><CardContent className="p-4 text-center"><BookOpen className="w-5 h-5 mx-auto mb-1" />{course.level}</CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Course Syllabus</h2>
              <Accordion type="single" collapsible className="w-full">
                {course.syllabus.map((section, index) => (
                  <AccordionItem key={index} value={`section-${index}`}>
                    <AccordionTrigger>{section.title}</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {section.lessons.map((lesson, lessonIndex) => (
                          <li key={lessonIndex} className="text-slate-600">
                            • {typeof lesson === 'string' ? lesson : lesson.title}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <p className="text-3xl font-bold text-[#1E3A8A] mb-4">FREE</p>
              {isEnrolled ? (
                <div className="w-full border-2 border-green-200 bg-green-50 rounded-lg py-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-800 font-semibold">You're enrolled!</p>
                </div>
              ) : (
                <Button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white"
                >
                  {isEnrolling ? 'Enrolling...' : 'Enroll Now'}
                </Button>
              )}
              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
