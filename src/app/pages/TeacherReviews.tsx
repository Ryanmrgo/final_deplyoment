"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Star } from 'lucide-react';
import { useAuth } from '@/app/components/AuthContext';
import { useRouter } from 'next/navigation';

interface ReviewItem {
  id: string;
  courseTitle: string;
  student: string;
  rating: number;
  comment: string;
  date: string;
}

export function TeacherReviews() {
  const { userRole, user, isLoading } = useAuth();
  const router = useRouter();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
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
    fetch('/api/teacher/reviews')
      .then((response) => (response.ok ? response.json() : { items: [] }))
      .then((data) => {
        const mapped: ReviewItem[] = (data.items || []).map((item: any) => ({
          id: String(item.id),
          courseTitle: String(item.courseTitle || 'Course'),
          student: String(item.student || 'Student'),
          rating: Math.max(0, Math.min(5, Number(item.rating) || 0)),
          comment: String(item.comment || ''),
          date: item.date ? new Date(item.date).toLocaleDateString() : '',
        }));
        setReviews(mapped);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [isLoading, user, userRole]);

  if (userRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Teacher access only</h2>
          <p className="text-gray-600 mb-6">Please sign in as a teacher to view reviews.</p>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Course Reviews</h1>
            <p className="text-gray-600">See what learners are saying about your courses.</p>
          </div>
          <Badge className="bg-[#1E3A8A] text-white">{reviews.length} total</Badge>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">All Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? <p className="text-gray-600">Loading reviews...</p> : null}
            {!loading && reviews.length === 0 ? (
              <p className="text-gray-600">No reviews yet.</p>
            ) : (
              reviews.map((review) => (
                <div key={`${review.courseTitle}-${review.id}`} className="border rounded-lg p-4">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-[#1E3A8A] text-white">
                          {review.student.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{review.student}</p>
                        <p className="text-sm text-gray-600">{review.courseTitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {[...Array(review.rating)].map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                      ))}
                      {[...Array(5 - review.rating)].map((_, index) => (
                        <Star key={`empty-${index}`} className="h-4 w-4 text-gray-300" />
                      ))}
                      <span className="text-sm text-gray-500">{review.date}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-gray-700">{review.comment}</p>
                </div>
              ))
            )}
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
