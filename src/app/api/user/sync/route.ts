import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    await connectDB();

    const role = (clerkUser.publicMetadata?.role as string) || 
                 (clerkUser.unsafeMetadata?.role as string) || 
                 'student';

    const user = await User.findByIdAndUpdate(
      userId,
      {
        _id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        imageUrl: clerkUser.imageUrl || '',
        role: role,
      },
      { upsert: true, new: true }
    );

    console.log('[User Sync] Successfully synced user to MongoDB:', user);

    return NextResponse.json({ 
      success: true, 
      user,
      message: 'User synced to MongoDB successfully' 
    });
  } catch (error) {
    console.error('[User Sync] Error syncing user:', error);
    return NextResponse.json({ error: 'Failed to sync user' }, { status: 500 });
  }
}
