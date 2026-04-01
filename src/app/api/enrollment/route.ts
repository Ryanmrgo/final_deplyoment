import { NextResponse } from 'next/server';
import { getEffectiveRole } from '@/lib/auth';

export async function POST(req: Request) {
  const { userId, role } = await getEffectiveRole();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  await req.json().catch(() => ({}));
  return NextResponse.json(
    { error: 'Direct enrollment is disabled. Submit /api/enrollment-request and wait for admin approval.' },
    { status: 403 }
  );
}
