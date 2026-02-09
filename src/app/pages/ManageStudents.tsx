"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { useAuth } from '@/app/components/AuthContext';

interface StudentEnrollment {
  id: string;
  name: string;
  email: string;
  initials: string;
  courseTitle: string;
  status: 'pending' | 'approved';
  enrolledAt: string;
}

const seedStudents: StudentEnrollment[] = [
  {
    id: 's-1',
    name: 'Fatima Hassan',
    email: 'fatima@example.com',
    initials: 'FH',
    courseTitle: 'JavaScript Essentials',
    status: 'pending',
    enrolledAt: '2026-02-05',
  },
  {
    id: 's-2',
    name: 'Ahmed Said',
    email: 'ahmed@example.com',
    initials: 'AS',
    courseTitle: 'UI/UX Design Fundamentals',
    status: 'approved',
    enrolledAt: '2026-02-01',
  },
  {
    id: 's-3',
    name: 'Omar Khalil',
    email: 'omar@example.com',
    initials: 'OK',
    courseTitle: 'Data Science with Python',
    status: 'pending',
    enrolledAt: '2026-02-03',
  },
];

export function ManageStudents() {
  const { userRole } = useAuth();
  const [students, setStudents] = useState<StudentEnrollment[]>(seedStudents);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingCount = useMemo(
    () => students.filter((student) => student.status === 'pending').length,
    [students]
  );

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
          <Badge className="bg-[#F59E0B] text-white">{pendingCount} pending</Badge>
        </div>

        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">Enrollment Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {students.map((student) => (
              <div key={student.id} className="border rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#1E3A8A] text-white">
                        {student.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Course: <span className="font-medium text-gray-900">{student.courseTitle}</span></p>
                    <p>Enrolled: {student.enrolledAt}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {student.status === 'pending' ? (
                      <Button
                        className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
                        onClick={() =>
                          setStudents((prev) =>
                            prev.map((item) =>
                              item.id === student.id ? { ...item, status: 'approved' } : item
                            )
                          )
                        }
                      >
                        Approve
                      </Button>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">Approved</Badge>
                    )}
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => setStudents((prev) => prev.filter((item) => item.id !== student.id))}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#1E3A8A] text-[#1E3A8A]"
                      onClick={() => setExpandedId((prev) => (prev === student.id ? null : student.id))}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>

                {expandedId === student.id ? (
                  <div className="mt-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900 mb-2">Student Profile</p>
                    <p>Role: Student</p>
                    <p>Courses enrolled: 1</p>
                    <p>Notes: Reach out for onboarding and course expectations.</p>
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
