"use client";

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';

interface EnrollmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  onSubmitted: () => void;
}

export function EnrollmentForm({ open, onOpenChange, courseId, onSubmitted }: EnrollmentFormProps) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [educationalBackground, setEducationalBackground] = useState('');
  const [reasonForJoining, setReasonForJoining] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFullName('');
    setAge('');
    setEducationalBackground('');
    setReasonForJoining('');
    setError('');
  };

  const handleSubmit = async () => {
    const parsedAge = Number(age);
    if (!fullName.trim() || !educationalBackground.trim() || !reasonForJoining.trim() || !age.trim()) {
      setError('All fields are required.');
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      setError('Age must be a valid number.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/enrollment-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          fullName: fullName.trim(),
          age: parsedAge,
          educationalBackground: educationalBackground.trim(),
          reasonForJoining: reasonForJoining.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit enrollment request');
      }

      onOpenChange(false);
      resetForm();
      onSubmitted();
    } catch (submitError: any) {
      setError(submitError?.message || 'Failed to submit enrollment request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enrollment Request</DialogTitle>
          <DialogDescription>Fill in your details to request access to this course.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="educationalBackground">Educational background</Label>
            <Input
              id="educationalBackground"
              value={educationalBackground}
              onChange={(e) => setEducationalBackground(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="reasonForJoining">Reason for joining</Label>
            <Textarea
              id="reasonForJoining"
              rows={4}
              value={reasonForJoining}
              onChange={(e) => setReasonForJoining(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
