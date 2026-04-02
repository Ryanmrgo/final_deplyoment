import { NextResponse } from 'next/server';

/**
 * Proxy download endpoint for files stored on Cloudinary or local storage.
 * Allows downloading files with proper Content-Disposition headers.
 * 
 * Usage: GET /api/files/download?url=<encoded-url>&name=<filename>
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileUrl = searchParams.get('url');
    const fileName = searchParams.get('name');

    if (!fileUrl) {
      return NextResponse.json({ error: 'File URL is required' }, { status: 400 });
    }

    // Validate URL is safe (must be from Cloudinary or local uploads)
    const isCloudinary = fileUrl.includes('cloudinary.com');
    const isLocal = fileUrl.startsWith('/uploads/');

    if (!isCloudinary && !isLocal) {
      return NextResponse.json({ error: 'Invalid file URL' }, { status: 400 });
    }

    // For local files, construct full URL
    let fullUrl = fileUrl;
    if (isLocal) {
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost';
      fullUrl = `${protocol}://${host}${fileUrl}`;
    }

    // Fetch the file
    const response = await fetch(fullUrl);
    if (!response.ok) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const displayName = fileName || fileUrl.split('/').pop() || 'download';

    // Return with download headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(displayName)}"`,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }
}
