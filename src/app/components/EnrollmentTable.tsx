"use client";

import { useMemo, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { EnrollmentRequestItem, statusBadgeClass } from '@/app/components/RequestCard';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Input } from '@/app/components/ui/input';

interface EnrollmentTableProps {
  items: EnrollmentRequestItem[];
  updatingId?: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function EnrollmentTable({ items, updatingId, onApprove, onReject }: EnrollmentTableProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const selectedRequest = useMemo(
    () => items.find((item) => item.id === selectedRequestId) || null,
    [items, selectedRequestId]
  );

  if (items.length === 0) {
    return <p className="text-sm text-gray-600">No enrollment requests yet.</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Application</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <p className="font-medium text-gray-900">{item.studentName}</p>
                <p className="text-xs text-gray-500">{item.studentEmail || '-'}</p>
              </TableCell>
              <TableCell>{item.courseName}</TableCell>
              <TableCell>
                <Button size="sm" variant="outline" onClick={() => setSelectedRequestId(item.id)}>
                  View Form
                </Button>
              </TableCell>
              <TableCell>
                <Badge className={statusBadgeClass(item.status)}>{item.status}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={item.status === 'approved' || updatingId === item.id}
                    onClick={() => onApprove(item.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-600"
                    disabled={item.status === 'rejected' || updatingId === item.id}
                    onClick={() => onReject(item.id)}
                  >
                    Reject
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={Boolean(selectedRequest)} onOpenChange={(open) => (!open ? setSelectedRequestId(null) : null)}>
        <DialogContent className="sm:max-w-2xl">
          {selectedRequest ? (
            <>
              <DialogHeader>
                <DialogTitle>Enrollment Request Form</DialogTitle>
                <DialogDescription>
                  Review the student&apos;s submitted information before approving or rejecting.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Student Account</Label>
                  <Input value={selectedRequest.studentName} readOnly />
                  <p className="text-xs text-gray-500">{selectedRequest.studentEmail || '-'}</p>
                </div>
                <div className="space-y-1">
                  <Label>Course</Label>
                  <Input value={selectedRequest.courseName} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={selectedRequest.fullName} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Age</Label>
                  <Input value={String(selectedRequest.age)} readOnly />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label>Educational Background</Label>
                  <Textarea value={selectedRequest.educationalBackground} readOnly rows={3} />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label>Reason For Joining</Label>
                  <Textarea value={selectedRequest.reasonForJoining} readOnly rows={5} />
                </div>
                <div className="md:col-span-2">
                  <Badge className={statusBadgeClass(selectedRequest.status)}>{selectedRequest.status}</Badge>
                </div>
              </div>

              <DialogFooter>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  disabled={selectedRequest.status === 'approved' || updatingId === selectedRequest.id}
                  onClick={() => {
                    onApprove(selectedRequest.id);
                    setSelectedRequestId(null);
                  }}
                >
                  Approve Request
                </Button>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600"
                  disabled={selectedRequest.status === 'rejected' || updatingId === selectedRequest.id}
                  onClick={() => {
                    onReject(selectedRequest.id);
                    setSelectedRequestId(null);
                  }}
                >
                  Reject Request
                </Button>
                <Button variant="outline" onClick={() => setSelectedRequestId(null)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
