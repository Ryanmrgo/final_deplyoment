import { NextResponse } from 'next/server';
import { getServerUploadMode } from '@/lib/uploadStrategy';

export async function GET() {
  return NextResponse.json({ mode: getServerUploadMode() });
}
