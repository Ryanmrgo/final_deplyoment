import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import User from '@/models/User';
import { getEffectiveRole } from '@/lib/auth';

export async function GET() {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
  }

  try {
    await connectDB();

    const users = await User.find().sort({ createdAt: -1 }).limit(50).lean();

    const items = users.map((u: any) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role || 'student',
      createdAt: u.createdAt,
      joined: new Date(u.createdAt).toISOString().split('T')[0],
      status: 'Active',
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
