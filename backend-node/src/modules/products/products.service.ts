import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

/**
 * Exact field set the FastAPI ProductResponse returns (a curated subset of the
 * products table — note: no tags/images/vendor_id/updated_at).
 */
const PRODUCT_FIELDS = `id, name, description, price, compare_price, category_id,
  vendor_name, image_url, rating, review_count, order_count, status,
  is_featured, city, created_at`;

const SORT_MAP: Record<string, string> = {
  popular: 'order_count DESC',
  price_asc: 'price ASC',
  price_desc: 'price DESC',
  rating: 'rating DESC',
  newest: 'created_at DESC',
};

export interface ProductQuery {
  category_id?: string;
  city?: string;
  search?: string;
  featured?: boolean;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  sort?: string;
  page: number;
  per_page: number;
}

@Injectable()
export class ProductsService {
  constructor(private readonly db: DatabaseService) {}

  async listCategories() {
    return this.db.query(
      `SELECT id, name, icon, description, is_active, sort_order
       FROM categories WHERE is_active = true ORDER BY sort_order`,
    );
  }

  async listOccasions() {
    return this.db.query(
      `SELECT id, name, icon, color, is_active, sort_order
       FROM occasions WHERE is_active = true ORDER BY sort_order`,
    );
  }

  async listProducts(q: ProductQuery) {
    const where: string[] = [`status = 'active'`];
    const params: any[] = [];
    const push = (value: any): string => {
      params.push(value);
      return `$${params.length}`;
    };

    if (q.category_id) where.push(`category_id = ${push(q.category_id)}`);
    if (q.city) where.push(`city = ${push(q.city)}`);
    if (q.search) {
      const p = push(`%${q.search}%`);
      where.push(`(name ILIKE ${p} OR vendor_name ILIKE ${p})`);
    }
    if (q.min_price != null) where.push(`price >= ${push(q.min_price)}`);
    if (q.max_price != null) where.push(`price <= ${push(q.max_price)}`);
    if (q.min_rating != null) where.push(`rating >= ${push(q.min_rating)}`);
    if (q.featured != null) where.push(`is_featured = ${push(q.featured)}`);

    const whereSql = `WHERE ${where.join(' AND ')}`;

    const totalRow = await this.db.queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM products ${whereSql}`,
      params,
    );
    const total = totalRow ? Number(totalRow.count) : 0;

    const orderBy = SORT_MAP[q.sort ?? 'popular'] ?? SORT_MAP.popular;
    const limitParam = push(q.per_page);
    const offsetParam = push((q.page - 1) * q.per_page);

    const items = await this.db.query(
      `SELECT ${PRODUCT_FIELDS} FROM products ${whereSql}
       ORDER BY ${orderBy} LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params,
    );

    return { items, total, page: q.page, per_page: q.per_page };
  }

  async getProduct(id: string) {
    const row = await this.db.queryOne(
      `SELECT ${PRODUCT_FIELDS} FROM products WHERE id = $1`,
      [id],
    );
    if (!row) throw new NotFoundException('Product not found');
    return row;
  }
}
