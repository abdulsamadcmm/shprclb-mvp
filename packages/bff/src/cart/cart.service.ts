import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
    if (
      !dto?.warehouse_price_id ||
      typeof dto.warehouse_price_id !== 'string' ||
      dto.warehouse_price_id.trim() === ''
    ) {
      throw new BadRequestException('warehouse_price_id must be a non-empty string');
    }
    const q = Number(dto.quantity);
    if (typeof dto.quantity !== 'number' && typeof dto.quantity !== 'string') {
      throw new BadRequestException('quantity is required');
    }
    if (Number.isNaN(q) || q < 1 || Math.floor(q) !== q) {
      throw new BadRequestException('quantity must be an integer >= 1');
    }

    try {
      const result = await this.medusaService.calculatePrice(
        dto.warehouse_price_id.trim(),
        q,
      );

      return {
        quantity: result.quantity,
        unit_price: result.unit_price,
        total_price: result.total_price,
        tier_applied: result.tier_applied,
        tier_name: result.tier_name,
      };
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      if (msg.includes('404') || msg.includes('not_found')) {
        throw new NotFoundException('Warehouse price not found');
      }
      throw err;
    }
  }
}
