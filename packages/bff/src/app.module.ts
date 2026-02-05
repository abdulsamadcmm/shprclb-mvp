import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MedusaModule } from './medusa/medusa.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [MedusaModule, ProductsModule, CategoriesModule, CartModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
