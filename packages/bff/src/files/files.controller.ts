import { Controller, Post, Body } from '@nestjs/common';
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
}
