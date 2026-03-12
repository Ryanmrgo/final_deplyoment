"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { useAuth } from '@/app/components/AuthContext';

interface StudentEnrollment {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  initials: string;
  courseId: string;
  courseTitle: string;
  enrollmentStatus: 'Active' | 'Completed' | 'Dropped';
  enrolledAt: string;
  progress: number;
  quizAverageScore: number;
  latestQuizScore: number;
  quizAttempts: number;
}

export function ManageStudents() {
  const { userRole, user, isLoading } = useAuth();
  const router = useRouter();
  const [students, setStudents] = useState<StudentEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => students.filter((student) => student.progress < 50).length,
    [students]
  );

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/sign-in');
      return;
    }
    if (!isLoading && user && userRole && userRole !== 'teacher') {
      router.push(`/dashboard/${userRole}`);
      return;
    }
  }, [isLoading, user, userRole, router]);

  useEffect(() => {
    if (isLoading || !user || userRole !== 'teacher') return;

    setLoading(true);
    setError(null);

    fetch('/api/teacher/students')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch students');
        }
        return data;
      })
      .then((data) => {
        setStudents(data.items || []);
      })
      .catch((fetchError: unknown) => {
        const message = fetchError instanceof Error ? fetchError.message : 'Failed to fetch students';
        setError(message);
      })
      .finally(() => setLoading(false));
  }, [isLoading, user, userRole]);

  if (userRole !== 'teacher') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Teacher access only</h2>
          <p className="text-gray-600 mb-6">Please sign in as a teacher to manage students.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Manage Students</h1>
            <p className="text-gray-600">Approve enrollments and keep track of your learners.</p>
          </div>
          <Badge className="bg-[#F59E0B] text-white">{pendingCount} at-risk</Badge>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Course Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="text-sm text-gray-600">Loading students...</div>
            ) : null}

            {!loading && students.length === 0 ? (
              <div className="text-sm text-gray-600">No students enrolled in your courses yet.</div>
            ) : null}

            {students.map((student) => (
              <div key={student.enrollmentId} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#1E3A8A] text-white">
                        {student.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{student.studentName}</p>
                      <p className="text-sm text-gray-600">{student.studentEmail}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Course: <span className="font-medium text-gray-900">{student.courseTitle}</span></p>
                    <p>
                      Enrolled:{' '}
                      {student.enrolledAt
                        ? new Date(student.enrolledAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                    <p>Progress: <span className="font-medium text-gray-900">{student.progress}%</span></p>
                    <p>Quiz Avg: <span className="font-medium text-gray-900">{student.quizAverageScore}%</span></p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#1E3A8A]/10 text-[#1E3A8A] border border-[#1E3A8A]/20">
                      {student.enrollmentStatus}
                    </Badge>
                    <Button
                      variant="outline"
                      className="border-[#1E3A8A] text-[#1E3A8A]"
                      onClick={() =>
                        setExpandedId((prev) =>
                          prev === student.enrollmentId ? null : student.enrollmentId
                        )
                      }
                    >
                      View Profile
                    </Button>
                  </div>
                </div>

                {expandedId === student.enrollmentId ? (
                  <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900 mb-2">Student Profile</p>
                    <p>Role: Student</p>
                    <p>Course: {student.courseTitle}</p>
                    <p>Progress: {student.progress}%</p>
                    <p>Latest Quiz Score: {student.latestQuizScore}%</p>
                    <p>Quiz Attempts: {student.quizAttempts}</p>
                  </div>
                ) : null}
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
