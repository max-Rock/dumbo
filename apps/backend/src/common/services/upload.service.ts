import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!
    );
    this.bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'menu-images';
  }

  /**
   * Upload image from base64 string (from mobile app)
   */
  async uploadImageFromBase64(base64String: string, folder: string = 'menu-items'): Promise<string> {
    if (!base64String) {
      throw new BadRequestException('No image data provided');
    }

    try {
      // Remove data URI prefix if exists (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      return await this.processAndUpload(buffer, folder);
    } catch (error) {
      console.error('Base64 image processing error:', error);
      throw new BadRequestException('Failed to process base64 image');
    }
  }

  /**
   * Upload image from buffer (from file upload)
   */
  async uploadImageFromBuffer(buffer: Buffer, folder: string = 'menu-items'): Promise<string> {
    if (!buffer) {
      throw new BadRequestException('No image buffer provided');
    }

    try {
      return await this.processAndUpload(buffer, folder);
    } catch (error) {
      console.error('Buffer image processing error:', error);
      throw new BadRequestException('Failed to process image buffer');
    }
  }

  /**
   * Process image and upload to Supabase Storage
   */
  private async processAndUpload(buffer: Buffer, folder: string): Promise<string> {
    try {
      // Convert to WebP and optimize using Sharp
      const webpBuffer = await sharp(buffer)
        .resize(800, 800, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({
          quality: 80,
          effort: 6,
        })
        .toBuffer();

      // Generate unique filename
      const fileName = `${folder}/${uuidv4()}.webp`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, webpBuffer, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new BadRequestException(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Image processing error:', error);
      throw new BadRequestException('Failed to process and upload image');
    }
  }

  /**
   * Delete image from Supabase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract filename from URL
      // Example URL: https://xxx.supabase.co/storage/v1/object/public/menu-images/menu-items/uuid.webp
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      
      // Find the index where 'public' appears and get everything after it
      const publicIndex = pathParts.indexOf('public');
      if (publicIndex === -1) {
        console.error('Invalid image URL format');
        return;
      }
      
      const fileName = pathParts.slice(publicIndex + 2).join('/'); // Skip 'public' and bucket name

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        console.error('Failed to delete image:', error);
      } else {
        console.log('Image deleted successfully:', fileName);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  /**
   * Replace old image with new one
   */
  async replaceImage(oldImageUrl: string | null, newBuffer: Buffer, folder: string = 'menu-items'): Promise<string> {
    // Delete old image if exists
    if (oldImageUrl) {
      await this.deleteImage(oldImageUrl);
    }

    // Upload new image
    return this.uploadImageFromBuffer(newBuffer, folder);
  }
}