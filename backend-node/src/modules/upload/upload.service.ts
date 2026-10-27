import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class UploadService {
  /** Upload an image buffer to Cloudinary, return the secure URL (mirrors app/core/upload.py). */
  async uploadImage(buffer: Buffer, mimetype: string): Promise<string> {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'quickgift',
      resource_type: 'image',
    });
    return result.secure_url;
  }
}
