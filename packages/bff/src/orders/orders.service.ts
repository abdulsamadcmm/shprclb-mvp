import { Injectable } from '@nestjs/common';
import { MedusaService, MedusaOrder, ShippingAddress } from '../medusa/medusa.service';

export interface CreateOrderDto {
  email: string;
  shipping_address: ShippingAddress;
  payment_method: string;
  items: Array<{
    variant_id: string;
    quantity: number;
    warehouse_price_id: string;
    location_id: string;
    location_name: string;
    moq: number;
    product_title: string;
    variant_title: string;
    thumbnail?: string;
  }>;
}

@Injectable()
export class OrdersService {
  constructor(private readonly medusaService: MedusaService) {}

  async createOrder(dto: CreateOrderDto): Promise<MedusaOrder> {
    try {
      // 1. Create Medusa cart with Europe region (which now includes India)
      const cart = await this.medusaService.createCart('reg_01KGGWX5Z4CV5X546EZDKXPQ47');

      // 2. Add cart items with warehouse metadata
      for (const item of dto.items) {
        await this.medusaService.addLineItem(cart.id, {
          variant_id: item.variant_id,
          quantity: item.quantity,
          metadata: {
            warehouse_price_id: item.warehouse_price_id,
            location_id: item.location_id,
            location_name: item.location_name,
            moq: item.moq,
            product_title: item.product_title,
            variant_title: item.variant_title,
            thumbnail: item.thumbnail,
          },
        });
      }

      // 3. Update cart with email and shipping address
      await this.medusaService.updateCart(cart.id, {
        email: dto.email,
        shipping_address: dto.shipping_address,
        metadata: {
          payment_method: dto.payment_method,
        },
      });

      // 4. Get and add shipping method
      const shippingOptions = await this.medusaService.getShippingOptions(cart.id);
      if (shippingOptions.length > 0) {
        await this.medusaService.addShippingMethod(cart.id, shippingOptions[0].id);
      }

      // 5. Initialize payment collection (required for completing cart)
      const paymentCollection = await this.medusaService.initializePayment(cart.id);

      // 6. Create payment session (required for completing cart)
      await this.medusaService.createPaymentSession(paymentCollection.id);

      // 7. Complete cart to create order
      const order = await this.medusaService.completeCart(cart.id);

      return order;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<MedusaOrder> {
    return this.medusaService.getOrder(orderId);
  }
}
