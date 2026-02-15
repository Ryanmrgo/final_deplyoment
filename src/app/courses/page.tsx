import { Suspense } from 'react';
import { Courses } from '@/app/pages/Courses';

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <Courses />
    </Suspense>
  );
}
