"use client";

import { useEffect, useState } from 'react';
import { useSession, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const { session } = useSession();
  const router = useRouter();
  const [selected, setSelected] = useState<'teacher' | 'student' | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingExistingRole, setCheckingExistingRole] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setCheckingExistingRole(false);
      return;
    }

    const clerkRole = (user.publicMetadata?.role || user.unsafeMetadata?.role) as string | undefined;
    if (clerkRole && ['teacher', 'student', 'admin'].includes(clerkRole)) {
      router.replace(`/dashboard/${clerkRole}`);
      return;
    }

    fetch('/api/user/profile')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.role && ['teacher', 'student', 'admin'].includes(data.role)) {
          router.replace(`/dashboard/${data.role}`);
          return;
        }
        setCheckingExistingRole(false);
      })
      .catch(() => setCheckingExistingRole(false));
  }, [isLoaded, user, router]);

  const handleRoleSelect = async (role: 'teacher' | 'student') => {
    if (!user) return;

    setLoading(true);
    try {
      // Update user's role via API
      const response = await fetch('/api/user/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to update role:', errorData);
        throw new Error('Failed to update role');
      }

      const data = await response.json();
      console.log('[Onboarding] Role update API response:', data);

      await user.reload();
      await session?.reload();

      // Force token refresh so middleware gets the new role (Clerk tokens can lag 10–15s otherwise)
      await session?.getToken({ skipCache: true });

      console.log('[Onboarding] Redirecting to dashboard:', role);

      // Use window.location for full page reload to ensure fresh tokens
      setTimeout(() => {
        window.location.href = `/dashboard/${role}`;
      }, 500);
    } catch (error) {
      console.error('Error setting role:', error);
      setLoading(false);
    }
  };

  if (!isLoaded || checkingExistingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/sign-in');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Welcome to AlinHub!
          </h1>
          <p className="text-slate-600 mb-8">
            {user.firstName}, let's get started. What's your role?
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Student Card */}
            <button
              onClick={() => {
                setSelected('student');
                handleRoleSelect('student');
              }}
              disabled={loading}
              className={`relative overflow-hidden rounded-lg p-8 text-left transition-all duration-300 ${
                selected === 'student'
                  ? 'ring-2 ring-blue-500 shadow-lg scale-105'
                  : 'border-2 border-slate-200 hover:border-blue-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="text-4xl mb-4">🎓</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Student</h2>
              <p className="text-slate-600">
                Learn from expert instructors and advance your skills
              </p>
            </button>

            {/* Teacher Card */}
            <button
              onClick={() => {
                setSelected('teacher');
                handleRoleSelect('teacher');
              }}
              disabled={loading}
              className={`relative overflow-hidden rounded-lg p-8 text-left transition-all duration-300 ${
                selected === 'teacher'
                  ? 'ring-2 ring-orange-500 shadow-lg scale-105'
                  : 'border-2 border-slate-200 hover:border-orange-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
              <div className="text-4xl mb-4">👨‍🏫</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Teacher</h2>
              <p className="text-slate-600">
                Create courses and teach students around the world
              </p>
            </button>
          </div>

          {loading && (
            <div className="mt-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="ml-3 text-slate-600">Setting up your account...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
