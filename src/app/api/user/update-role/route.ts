import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  if (!body?.role) {
    return NextResponse.json({ error: 'role is required' }, { status: 400 });
  }

  if (!['teacher', 'student'].includes(body.role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be "teacher" or "student"' },
      { status: 400 }
    );
  }

  try {
    const client = await clerkClient();
    await client.users.updateUser(userId, {
      publicMetadata: {
        role: body.role,
      },
    });

    await connectDB();
    await User.findByIdAndUpdate(userId, { role: body.role });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
