import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MedusaModule } from '../medusa/medusa.module';

@Module({
  imports: [MedusaModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
