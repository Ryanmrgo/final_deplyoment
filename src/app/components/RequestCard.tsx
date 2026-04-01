"use client";

import { Badge } from '@/app/components/ui/badge';

export interface EnrollmentRequestItem {
  id: string;
  studentName: string;
  studentEmail?: string;
  courseName: string;
  fullName: string;
  age: number;
  educationalBackground: string;
  reasonForJoining: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export function statusBadgeClass(status: EnrollmentRequestItem['status']) {
  if (status === 'approved') return 'bg-green-100 text-green-700';
  if (status === 'rejected') return 'bg-red-100 text-red-700';
  return 'bg-yellow-100 text-yellow-700';
}

export function RequestCard({ item }: { item: EnrollmentRequestItem }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <p className="font-semibold text-gray-900">{item.fullName}</p>
        <Badge className={statusBadgeClass(item.status)}>{item.status}</Badge>
      </div>
      <p className="text-xs text-gray-500">Account: {item.studentName}{item.studentEmail ? ` (${item.studentEmail})` : ''}</p>
      <p className="text-sm text-gray-700">Course: {item.courseName}</p>
      <p className="text-sm text-gray-700">Age: {item.age}</p>
      <p className="text-sm text-gray-700">Education: {item.educationalBackground}</p>
      <p className="text-sm text-gray-700">Reason: {item.reasonForJoining}</p>
    </div>
  );
}
