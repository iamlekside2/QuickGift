import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { AuthGuard } from '../../common/auth.guard';
import { CurrentUser, AuthUser } from '../../common/current-user.decorator';

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

  // ---- a seller's own listings ----
  @UseGuards(AuthGuard)
  @Get('my-products')
  myProducts(@CurrentUser() user: AuthUser, @Query() q: Record<string, string>) {
    return this.products.listMine(user.user_id, q);
  }

  @UseGuards(AuthGuard)
  @Post('my-products')
  @HttpCode(200)
  createMine(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.products.createMine(user.user_id, body);
  }

  @UseGuards(AuthGuard)
  @Patch('my-products/:id')
  updateMine(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: any,
  ) {
    return this.products.updateMine(user.user_id, id, body);
  }

  @UseGuards(AuthGuard)
  @Delete('my-products/:id')
  deleteMine(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.products.deleteMine(user.user_id, id);
  }

  @Get()
  list(@Query() q: Record<string, string>) {
    const num = (v?: string) =>
      v === undefined || v === '' ? undefined : Number(v);
    return this.products.listProducts({
      category_id: q.category_id,
      city: q.city,
      search: q.search,
      occasion: q.occasion,
      featured: q.featured === undefined ? undefined : q.featured === 'true',
      min_price: num(q.min_price),
      max_price: num(q.max_price),
      min_rating: num(q.min_rating),
      sort: q.sort,
      page: q.page,
      per_page: q.per_page,
    });
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.products.getProduct(id);
  }
}
