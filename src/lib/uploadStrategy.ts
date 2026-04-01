/**
 * Storage preference for file uploads.
 * - Set USE_LOCAL_UPLOADS=true to force filesystem under public/uploads (demo / local dev).
 * - Otherwise Cloudinary is used when all CLOUDINARY_* vars are set.
 */
export const envTruthy = (value: string | undefined): boolean => {
  const v = String(value ?? '')
    .trim()
    .replace(/\r$/, '')
    .toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
};

export const canUseCloudinary = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

/** When true, never use Cloudinary for server-side uploads. */
export const useLocalFileStorage = () => envTruthy(process.env.USE_LOCAL_UPLOADS);

/** Prefer Cloudinary only when local is not forced and Cloudinary is configured. */
export const useCloudinaryForStorage = () => !useLocalFileStorage() && canUseCloudinary();

export type UploadMode = 'local' | 'cloudinary';

export const getServerUploadMode = (): UploadMode =>
  useCloudinaryForStorage() ? 'cloudinary' : 'local';
