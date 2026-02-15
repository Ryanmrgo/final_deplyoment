"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function Login() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Clerk sign-in page
    router.push('/auth/sign-in');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-600">Redirecting to login...</p>
    </div>
  );
}
