import { Controller, Get, Param } from '@nestjs/common';
import { CategoryService } from './categories.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoriesService: CategoryService) {}
  @Get()
  findAll() {
    return this.categoriesService.aggregateByType();
  }
  @Get(':type')
  findByType(@Param('type') type: string) {
    return this.categoriesService.findByType(type);
  }
}
