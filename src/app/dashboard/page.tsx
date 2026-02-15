import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import connectDB from '@/config/db';
import User from '@/models/User';

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect('/auth/sign-in');
  }

  let role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  // Fallback: check MongoDB if role not in session (Clerk session can be stale after sign-in)
  if (!role) {
    try {
      await connectDB();
      const user = await User.findById(userId).lean();
      if (user?.role) role = user.role;
    } catch {
      // Ignore DB errors
    }
  }

  if (!role) {
    redirect('/dashboard/onboarding');
  }

  redirect(`/dashboard/${role}`);
}
