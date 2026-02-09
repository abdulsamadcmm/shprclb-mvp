import { Controller, Post, Body, Logger } from '@nestjs/common';
import { CartService } from './cart.service';
import type { CalculateLineItemDto } from './cart.service';

@Controller('cart')
export class CartController {
  private readonly logger = new Logger(CartController.name);

  constructor(private readonly cartService: CartService) {}

  @Post('calculate-line-item')
  async calculateLineItem(@Body() dto: CalculateLineItemDto) {
    try {
      return await this.cartService.calculateLineItem(dto);
    } catch (err) {
      this.logger.error('calculate-line-item failed', err);
      throw err;
    }
  }
}
