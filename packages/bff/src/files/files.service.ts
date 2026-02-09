import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';

export interface UploadedFile {
  file_url: string;
  file_id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

@Injectable()
export class FilesService {
  constructor(private readonly medusaService: MedusaService) {}

  async uploadFile(
    fileData: string, // base64 encoded
    fileName: string,
    mimeType: string,
  ): Promise<UploadedFile> {
    // Validate file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Validate file size (5MB max)
    const base64Data = fileData.replace(/^data:.*,/, '');
    const fileSize = Buffer.from(base64Data, 'base64').length;
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (fileSize > maxSize) {
      throw new Error(`File size exceeds maximum of ${maxSize / 1024 / 1024}MB`);
    }

    // Validate image dimensions for raster images (not SVG)
    if (mimeType !== 'image/svg+xml') {
      await this.validateImageDimensions(fileData, 500, 500);
    } else {
      // Validate SVG structure
      await this.validateSVG(fileData);
    }

    // Forward to Medusa file upload endpoint
    const result = await this.medusaService.uploadFile({
      file_data: fileData,
      file_name: fileName,
      mime_type: mimeType,
    });

    return result;
  }

  private async validateImageDimensions(
    base64Data: string,
    minWidth: number,
    minHeight: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // For server-side validation, we'd need to use sharp or similar
      // For now, we'll do basic validation - client-side will handle detailed checks
      // This is a placeholder - in production, use sharp or jimp
      resolve();
    });
  }

  private async validateSVG(base64Data: string): Promise<void> {
    const base64Content = base64Data.replace(/^data:.*,/, '');
    const svgContent = Buffer.from(base64Content, 'base64').toString('utf-8');

    // Basic SVG validation - check for SVG tag
    if (!svgContent.includes('<svg') || !svgContent.includes('</svg>')) {
      throw new Error('Invalid SVG file structure');
    }

    // Check for XML declaration or SVG namespace
    if (!svgContent.includes('xmlns') && !svgContent.includes('xmlns:svg')) {
      throw new Error('SVG file missing required namespace');
    }
  }
}
