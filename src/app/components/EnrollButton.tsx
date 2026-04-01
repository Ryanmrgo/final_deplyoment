"use client";

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { EnrollmentForm } from '@/app/components/EnrollmentForm';

interface EnrollButtonProps {
  courseId: string;
  disabled?: boolean;
  /** When true, button is disabled and enrollment request cannot be opened. */
  courseFull?: boolean;
  onSubmitted: () => void;
}

export function EnrollButton({ courseId, disabled = false, courseFull = false, onSubmitted }: EnrollButtonProps) {
  const [open, setOpen] = useState(false);

  const locked = disabled || courseFull;

  return (
    <>
      <Button
        onClick={() => !locked && setOpen(true)}
        disabled={locked}
        className="w-full bg-[#F59E0B] hover:bg-[#F59E0B]/90 text-white py-6 text-lg mb-4 disabled:opacity-70"
      >
        {courseFull ? 'Course full' : 'Enroll Now'}
      </Button>
      {!courseFull ? (
        <EnrollmentForm open={open} onOpenChange={setOpen} courseId={courseId} onSubmitted={onSubmitted} />
      ) : null}
    </>
  );
}
