import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { MedusaModule } from '../medusa/medusa.module';

@Module({
  imports: [MedusaModule],
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
