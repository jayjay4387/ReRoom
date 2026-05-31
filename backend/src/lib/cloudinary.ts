import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload a base64 image (no data-URI prefix) and return its CDN URL.
export async function uploadImageBase64(base64: string, folder = 'reroom/frames'): Promise<string> {
  const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64}`, { folder });
  return result.secure_url;
}

// Re-host a remote video (e.g. the temporary eachlabs URL) on Cloudinary so it
// outlives the generation job, and return the persistent CDN URL.
export async function uploadVideoFromUrl(url: string, folder = 'reroom/videos'): Promise<string> {
  const result = await cloudinary.uploader.upload(url, { folder, resource_type: 'video' });
  return result.secure_url;
}
