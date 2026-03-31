import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

const ensureCloudinaryConfig = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are not set');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
};

const sanitizeBaseName = (value: string) => value.replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 40) || 'file';

export async function uploadToCloudinary(
  file: File,
  options: {
    folder: string;
    resourceType: 'image' | 'raw' | 'video';
  }
) {
  const uploader = ensureCloudinaryConfig();
  const ext = `.${file.name.split('.').pop() || ''}`.toLowerCase();
  const safeBase = sanitizeBaseName(file.name.replace(ext, ''));
  const publicId = `${Date.now()}-${crypto.randomUUID()}-${safeBase}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
    const stream = uploader.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType,
        public_id: publicId,
        use_filename: true,
        unique_filename: true,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error || new Error('Upload failed'));
          return;
        }
        resolve(uploadResult);
      }
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    name: file.name,
    type: file.type || ext.replace('.', ''),
  };
}
