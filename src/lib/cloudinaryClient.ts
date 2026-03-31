'use client';

type CloudinarySignature = {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  resourceType: 'image' | 'raw' | 'video';
};

type CloudinaryUploadOptions = {
  folder: string;
  resourceType?: 'image' | 'raw' | 'video';
};

type CloudinaryUploadResult = {
  url: string;
  name: string;
  type: string;
  resourceType: 'image' | 'raw' | 'video';
};

const inferResourceType = (file: File): 'image' | 'raw' | 'video' => {
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'raw';
};

export async function uploadFileToCloudinary(
  file: File,
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResult> {
  const resourceType = options.resourceType ?? inferResourceType(file);

  const signatureRes = await fetch('/api/uploads/cloudinary-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: options.folder, resourceType }),
  });

  if (!signatureRes.ok) {
    const payload = await signatureRes.json().catch(() => ({}));
    throw new Error(payload?.error || 'Failed to prepare upload');
  }

  const signature = (await signatureRes.json()) as CloudinarySignature;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('folder', options.folder);

  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const uploadPayload = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok) {
    throw new Error(uploadPayload?.error?.message || 'Cloudinary upload failed');
  }

  return {
    url: uploadPayload.secure_url,
    name: uploadPayload.original_filename || file.name,
    type: uploadPayload.format || file.type || '',
    resourceType: signature.resourceType,
  };
}
