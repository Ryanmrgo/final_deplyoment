import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  if (!role) {
    redirect('/dashboard/onboarding');
  }

  redirect(`/dashboard/${role}`);
}
