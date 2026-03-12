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
    const clerkUser = await client.users.getUser(userId);

    const primaryEmail =
      clerkUser.emailAddresses.find(
        (email) => email.id === clerkUser.primaryEmailAddressId
      )?.emailAddress ||
      clerkUser.emailAddresses[0]?.emailAddress ||
      `${userId}@clerk.local`;

    const displayName =
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
      clerkUser.username ||
      'User';

    await client.users.updateUser(userId, {
      publicMetadata: {
        role: body.role,
      },
    });

    await connectDB();
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          _id: userId,
          email: primaryEmail,
          name: displayName,
          imageUrl: clerkUser.imageUrl || '',
          role: body.role,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
