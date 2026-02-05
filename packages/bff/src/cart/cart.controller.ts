import { Controller, Post, Body } from '@nestjs/common';
import { CartService } from './cart.service';
import type { CalculateLineItemDto } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('calculate-line-item')
  async calculateLineItem(@Body() dto: CalculateLineItemDto) {
    return this.cartService.calculateLineItem(dto);
  }
}
