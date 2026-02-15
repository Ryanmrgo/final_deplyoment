import { auth } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';

/**
 * Get the user's role: from Clerk session first, then from MongoDB if missing.
 * Session claims can be stale after onboarding (update-role), so we fall back to DB.
 */
export async function getEffectiveRole(): Promise<{ userId: string | null; role: string | null }> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { userId: null, role: null };

  let role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role ?? null;
  if (role) return { userId, role };

  try {
    await connectDB();
    const user = await User.findById(userId);
    if (user?.role) return { userId, role: user.role };
  } catch {
    // ignore DB errors
  }
  return { userId, role: null };
}
