import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  // NOTE: static routes declared before the ':id' param route so they win.
  @Get('categories')
  categories() {
    return this.products.listCategories();
  }

  @Get('occasions')
  occasions() {
    return this.products.listOccasions();
  }

  @Get()
  list(@Query() q: Record<string, string>) {
    const num = (v?: string) =>
      v === undefined || v === '' ? undefined : Number(v);
    return this.products.listProducts({
      category_id: q.category_id,
      city: q.city,
      search: q.search,
      featured: q.featured === undefined ? undefined : q.featured === 'true',
      min_price: num(q.min_price),
      max_price: num(q.max_price),
      min_rating: num(q.min_rating),
      sort: q.sort,
      page: num(q.page) ?? 1,
      per_page: num(q.per_page) ?? 20,
    });
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.products.getProduct(id);
  }
}
