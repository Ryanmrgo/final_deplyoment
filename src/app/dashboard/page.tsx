import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  // Fetch user data directly from Clerk to get publicMetadata
  let role: string | undefined;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    role = (user.publicMetadata?.role as string) || (user.unsafeMetadata?.role as string);
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
