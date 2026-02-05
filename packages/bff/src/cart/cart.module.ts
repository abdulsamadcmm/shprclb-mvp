import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { MedusaModule } from '../medusa/medusa.module';

@Module({
  imports: [MedusaModule],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
