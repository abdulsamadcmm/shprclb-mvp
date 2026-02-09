import { Controller, Post, Body, Get, Query, Res, HttpException, HttpStatus } from '@nestjs/common';
import { FilesService } from './files.service';

export interface UploadFileDto {
  file_data: string; // base64 encoded file
  file_name: string;
  mime_type: string;
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  async uploadFile(@Body() dto: UploadFileDto) {
    const result = await this.filesService.uploadFile(
      dto.file_data,
      dto.file_name,
      dto.mime_type,
    );
    return result;
  }

  @Get('proxy-image')
  async proxyImage(@Query('url') url: string, @Res() res: any) {
    if (!url) {
      res.code(HttpStatus.BAD_REQUEST).send({ error: 'URL parameter is required' });
      return;
    }

    try {
      // Validate URL
      const imageUrl = decodeURIComponent(url);
      if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
        res.code(HttpStatus.BAD_REQUEST).send({ error: 'Invalid URL' });
        return;
      }

      // Fetch the image
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        res.code(HttpStatus.BAD_GATEWAY).send({ 
          error: 'Failed to fetch image', 
          status: response.status 
        });
        return;
      }

      // Get content type
      const contentType = response.headers.get('content-type') || 'image/png';
      
      // Set CORS headers (Fastify way)
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      res.header('Content-Type', contentType);
      res.header('Cache-Control', 'public, max-age=31536000');

      // Stream the image
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error proxying image:', error);
      res.code(HttpStatus.INTERNAL_SERVER_ERROR).send({ 
        error: 'Failed to proxy image',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
