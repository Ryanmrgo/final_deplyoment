"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Register() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Clerk sign-up page
    router.push('/auth/sign-up');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-600">Redirecting to registration...</p>
    </div>
  );
}
