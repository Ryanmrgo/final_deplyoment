import crypto from 'crypto';
import path from 'path';
import { promises as fs } from 'fs';

const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads', 'lessons');

const sanitizeBaseName = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'file';

export async function saveFileLocally(file: File) {
  await fs.mkdir(UPLOAD_ROOT, { recursive: true });

  const ext = `.${file.name.split('.').pop() || ''}`.toLowerCase();
  const safeBase = sanitizeBaseName(file.name.replace(ext, ''));
  const filename = `${Date.now()}-${crypto.randomUUID()}-${safeBase}${ext}`;
  const fullPath = path.join(UPLOAD_ROOT, filename);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(fullPath, Buffer.from(bytes));

  return {
    url: `/uploads/lessons/${filename}`,
    name: file.name,
    type: file.type || ext.replace('.', ''),
  };
}
