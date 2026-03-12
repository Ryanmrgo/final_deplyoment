import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import { getEffectiveRole } from '@/lib/auth';

const ALLOWED_ROLES = ['student', 'teacher', 'admin'] as const;

type AllowedRole = (typeof ALLOWED_ROLES)[number];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (role !== 'admin') return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  try {
    const { id } = await params;
    const body = await req.json();
    const nextRole = String(body.role || '').trim().toLowerCase();

    if (!ALLOWED_ROLES.includes(nextRole as AllowedRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    user.role = nextRole;
    user.updatedAt = new Date();
    await user.save();

    try {
      const client = await clerkClient();
      await client.users.updateUser(id, {
        publicMetadata: { role: nextRole },
      });
    } catch (error) {
      console.error('Failed to sync role to Clerk:', error);
    }

    return NextResponse.json({ success: true, role: nextRole });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
