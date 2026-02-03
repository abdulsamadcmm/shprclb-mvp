import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MedusaModule } from './medusa/medusa.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [MedusaModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
