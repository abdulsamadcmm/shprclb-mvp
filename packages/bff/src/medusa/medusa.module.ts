import { Module, Global } from '@nestjs/common';
import { MedusaService } from './medusa.service';

@Global()
@Module({
  providers: [MedusaService],
  exports: [MedusaService],
})
export class MedusaModule {}
