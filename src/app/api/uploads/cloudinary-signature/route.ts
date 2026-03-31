import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';

const ALLOWED_TYPES = ['image', 'raw', 'video'] as const;

type ResourceType = (typeof ALLOWED_TYPES)[number];

type SignatureRequest = {
  folder?: string;
  resourceType?: ResourceType;
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as SignatureRequest;
  const folder = typeof body.folder === 'string' ? body.folder.trim() : '';
  const resourceType: ResourceType = ALLOWED_TYPES.includes(body.resourceType as ResourceType)
    ? (body.resourceType as ResourceType)
    : 'raw';

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Cloudinary is not configured' }, { status: 500 });
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: folder || undefined,
    },
    apiSecret
  );

  return NextResponse.json({
    signature,
    timestamp,
    cloudName,
    apiKey,
    resourceType,
  });
}
