"use client";

import { Badge } from '@/app/components/ui/badge';

type EnrollmentRequestStatus = 'pending' | 'approved' | 'rejected' | null;

export function EnrollmentStatus({ status }: { status: EnrollmentRequestStatus }) {
  if (!status) return null;

  if (status === 'pending') {
    return (
      <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
        <Badge className="mb-2 bg-yellow-100 text-yellow-700">Pending</Badge>
        <p className="text-sm text-yellow-800">Waiting for admin approval.</p>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 p-3">
        <Badge className="mb-2 bg-green-100 text-green-700">Approved</Badge>
        <p className="text-sm text-green-800">Access granted. You can now start learning.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-red-200 bg-red-50 p-3">
      <Badge className="mb-2 bg-red-100 text-red-700">Rejected</Badge>
      <p className="text-sm text-red-800">Request denied. You currently cannot access this course.</p>
    </div>
  );
}
