import { Controller, Get, Param, Query, NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { MedusaService } from '../medusa/medusa.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly medusaService: MedusaService,
  ) {}

  @Get()
  async getProducts(@Query('category_id') categoryId?: string) {
    const products = await this.productsService.getProductsWithWarehousePricing(categoryId);
    return { products };
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    const product = await this.productsService.getProductWithWarehousePricing(id);

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  @Get(':id/price')
  async calculatePrice(
    @Param('id') id: string,
    @Query('warehouse_price_id') warehousePriceId: string,
    @Query('quantity') quantityStr: string,
  ) {
    if (!warehousePriceId) {
      throw new BadRequestException('warehouse_price_id is required');
    }

    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity < 1) {
      throw new BadRequestException('quantity must be a positive integer');
    }

    try {
      const result = await this.medusaService.calculatePrice(warehousePriceId, quantity);
      return result;
    } catch (error) {
      throw new NotFoundException('Failed to calculate price');
    }
  }
}
