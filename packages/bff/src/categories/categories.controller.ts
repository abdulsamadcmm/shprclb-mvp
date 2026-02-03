import { Controller, Get } from '@nestjs/common';
import { MedusaService } from '../medusa/medusa.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly medusaService: MedusaService) {}

  @Get()
  async getCategories() {
    const categories = await this.medusaService.getCategories();
    // Only return active categories
    const activeCategories = categories.filter((c) => c.is_active);
    return { categories: activeCategories };
  }
}
