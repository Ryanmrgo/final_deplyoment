import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import connectDB from '@/config/db';
import Enrollment from '@/models/Enrollment';
import mongoose from 'mongoose';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;

  if (role !== 'student') {
    return NextResponse.json({ error: 'Student role required' }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (!id) {
    return NextResponse.json({ error: 'Enrollment ID required' }, { status: 400 });
  }

  try {
    await connectDB();

    const update: any = { updatedAt: new Date(), lastAccessedAt: new Date() };
    if (typeof body.progress === 'number') {
      update.progress = Math.min(100, Math.max(0, body.progress));
      if (update.progress >= 100) {
        update.status = 'Completed';
        update.completedAt = new Date();
        update.certificate = { issued: true, issuedAt: new Date(), certificateUrl: '' };
      }
    }

    const enrollment = await Enrollment.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), studentId: userId },
      update,
      { new: true }
    )
      .populate('courseId')
      .lean();

    if (!enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, enrollment });
  } catch (error) {
    console.error('Error updating enrollment:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
