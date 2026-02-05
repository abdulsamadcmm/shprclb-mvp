import { Injectable } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';

export interface CalculateLineItemDto {
  warehouse_price_id: string;
  quantity: number;
}

export interface CalculatedLineItem {
  quantity: number;
  unit_price: number;
  total_price: number;
  tier_applied: boolean;
  tier_name: string;
}

@Injectable()
export class CartService {
  constructor(private readonly medusaService: MedusaService) {}

  async calculateLineItem(
    dto: CalculateLineItemDto,
  ): Promise<CalculatedLineItem> {
    const result = await this.medusaService.calculatePrice(
      dto.warehouse_price_id,
      dto.quantity,
    );

    return {
      quantity: result.quantity,
      unit_price: result.unit_price,
      total_price: result.total_price,
      tier_applied: result.tier_applied,
      tier_name: result.tier_name,
    };
  }
}
