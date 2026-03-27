import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { role?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body. Expected { "role": "teacher" | "student" }' },
        { status: 400 }
      );
    }

    if (!body?.role) {
      return NextResponse.json({ error: 'role is required' }, { status: 400 });
    }

    if (!['teacher', 'student'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "teacher" or "student"' },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    console.log('[Update Role API] Updating role for user:', userId, 'to role:', body.role);
    
    // Get full user data from Clerk
    const clerkUser = await client.users.getUser(userId);
    
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: body.role,
      },
    });

    console.log('[Update Role API] Clerk metadata updated successfully');

    await connectDB();

    const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress || '';
    const displayName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
    const fallbackName =
      displayName ||
      clerkUser.username ||
      (primaryEmail ? primaryEmail.split('@')[0] : 'User');
    
    // Upsert user with all fields to ensure document exists
    await User.findByIdAndUpdate(
      userId,
      {
        _id: userId,
        email: primaryEmail,
        name: fallbackName,
        imageUrl: clerkUser.imageUrl || '',
        role: body.role,
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    console.log('[Update Role API] Database updated successfully');

    return NextResponse.json({ success: true, role: body.role });
  } catch (error) {
    console.error('Error updating role:', error);
    const message = error instanceof Error ? error.message : 'Failed to update role';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
