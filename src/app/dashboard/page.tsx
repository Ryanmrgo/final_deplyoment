import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

type DashboardRole = 'teacher' | 'student' | 'admin';

function normalizeRole(value: unknown): DashboardRole | undefined {
  if (typeof value !== 'string') return undefined;
  if (value === 'teacher' || value === 'student' || value === 'admin') return value;
  return undefined;
}

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  // Fetch user data directly from Clerk to get publicMetadata
  let role: DashboardRole | undefined;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    role = normalizeRole(user.publicMetadata?.role) || normalizeRole(user.unsafeMetadata?.role);
  } catch (error) {
    console.error('[Dashboard Page] Error fetching user:', error);
  }

  // Debug logging
  console.log('[Dashboard Page Debug]', {
    userId,
    role
  });

  if (!role) {
    redirect('/dashboard/onboarding');
  }

  redirect(`/dashboard/${role}`);
}
