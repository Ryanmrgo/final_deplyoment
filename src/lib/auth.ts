import { auth, clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';

const normalizeRole = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

/**
 * Get the user's role: from Clerk session first, then from MongoDB if missing.
 * Session claims can be stale after onboarding (update-role), so we fall back to DB.
 */
export async function getEffectiveRole(): Promise<{ userId: string | null; role: string | null }> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { userId: null, role: null };

  const sessionRole = normalizeRole(
    (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role ?? null
  );

  const unsafeSessionRole = normalizeRole(
    (sessionClaims as any)?.unsafeMetadata?.role ?? null
  );

  const privateSessionRole = normalizeRole(
    (sessionClaims as any)?.privateMetadata?.role ?? null
  );

  try {
    await connectDB();
    const user = await User.findById(userId);
    const dbRole = normalizeRole(user?.role);
    if (dbRole) return { userId, role: dbRole };
  } catch {
    // ignore DB errors
  }

  if (sessionRole || unsafeSessionRole || privateSessionRole) {
    return { userId, role: sessionRole ?? unsafeSessionRole ?? privateSessionRole };
  }

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const clerkRole =
      normalizeRole((clerkUser.publicMetadata as any)?.role) ??
      normalizeRole((clerkUser.unsafeMetadata as any)?.role) ??
      normalizeRole((clerkUser.privateMetadata as any)?.role);

    if (clerkRole) {
      return { userId, role: clerkRole };
    }
  } catch {
    // ignore Clerk lookup errors
  }

  return { userId, role: null };
}
