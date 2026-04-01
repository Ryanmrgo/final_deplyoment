import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';
import { useLocalFileStorage } from '@/lib/uploadStrategy';

const sanitizeBaseName = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'file';

export async function saveFileLocally(file: File, folder = 'lessons') {
  const allowLocalOnVercel = useLocalFileStorage();
  if (process.env.VERCEL && !allowLocalOnVercel) {
    throw new Error('Local uploads are disabled in serverless environments. Configure Cloudinary or set USE_LOCAL_UPLOADS (ephemeral on Vercel).');
  }

  const safeFolder = String(folder || 'lessons').replace(/[^a-zA-Z0-9-_]/g, '') || 'lessons';
  const uploadRoot = path.join(process.cwd(), 'public', 'uploads', safeFolder);

  await fs.mkdir(uploadRoot, { recursive: true });

  const ext = `.${file.name.split('.').pop() || ''}`.toLowerCase();
  const safeBase = sanitizeBaseName(file.name.replace(ext, ''));
  const filename = `${Date.now()}-${crypto.randomUUID()}-${safeBase}${ext}`;
  const fullPath = path.join(uploadRoot, filename);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(fullPath, Buffer.from(bytes));

  return {
    url: `/uploads/${safeFolder}/${filename}`,
    name: file.name,
    type: file.type || ext.replace('.', ''),
  };
}
