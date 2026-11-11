import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { paging } from '../../common/paging';

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

const MAX_PRICE = 100_000_000;

export interface ProductQuery {
  category_id?: string;
  city?: string;
  search?: string;
  occasion?: string;
  featured?: boolean;
  min_price?: number;
  max_price?: number;
  min_rating?: number;
  sort?: string;
  page?: number | string;
  per_page?: number | string;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const like = (term: string) => '%' + term.trim().replace(/[\\%_]/g, (c) => '\\' + c) + '%';

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
      const p = push(like(q.search));
      where.push(`(name ILIKE ${p} OR vendor_name ILIKE ${p})`);
    }
    if (q.occasion) {
      // Products are tagged with the occasions they suit (comma-separated tags).
      // Accept either an occasion id or its name.
      const occ = await this.db.queryOne<{ name: string }>(
        `SELECT name FROM occasions WHERE id = $1 OR lower(name) = lower($1) LIMIT 1`,
        [q.occasion],
      );
      const p = push(like(occ?.name ?? q.occasion));
      where.push(`tags ILIKE ${p}`);
    }
    if (finite(q.min_price)) where.push(`price >= ${push(q.min_price)}`);
    if (finite(q.max_price)) where.push(`price <= ${push(q.max_price)}`);
    if (finite(q.min_rating)) where.push(`rating >= ${push(q.min_rating)}`);
    if (q.featured != null) where.push(`is_featured = ${push(q.featured)}`);

    const whereSql = `WHERE ${where.join(' AND ')}`;

    const totalRow = await this.db.queryOne<{ count: number }>(
      `SELECT count(*)::int AS count FROM products ${whereSql}`,
      params,
    );
    const total = totalRow ? Number(totalRow.count) : 0;

    // Own-property lookup only: `?sort=constructor` must not reach the SQL.
    const sortKey = q.sort && Object.prototype.hasOwnProperty.call(SORT_MAP, q.sort) ? q.sort : 'popular';
    const orderBy = SORT_MAP[sortKey];
    const { page, perPage, offset } = paging(q);
    const limitParam = push(perPage);
    const offsetParam = push(offset);

    const items = await this.db.query(
      `SELECT ${PRODUCT_FIELDS} FROM products ${whereSql}
       ORDER BY ${orderBy} LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params,
    );

    return { items, total, page, per_page: perPage };
  }

  async getProduct(id: string) {
    // Drafts are not public; archived (inactive) products stay readable so
    // order history can still link to them.
    const row = await this.db.queryOne(
      `SELECT ${PRODUCT_FIELDS} FROM products WHERE id = $1 AND status <> 'draft'`,
      [id],
    );
    if (!row) throw new NotFoundException('Product not found');
    return row;
  }

  // ---- seller's own products ----

  private async providerOf(userId: string) {
    const provider = await this.db.queryOne<any>(
      `SELECT id, business_name, status, city FROM providers WHERE user_id = $1`,
      [userId],
    );
    if (!provider) throw new ForbiddenException('Set up your provider profile first');
    return provider;
  }

  /** Accepts a category id or a category name ("Cakes"). */
  private async resolveCategory(value: unknown): Promise<string> {
    const v = String(value ?? '').trim();
    if (!v) throw new BadRequestException('Please choose a category');
    const cat = await this.db.queryOne<{ id: string }>(
      `SELECT id FROM categories WHERE id = $1 OR lower(name) = lower($1) LIMIT 1`,
      [v],
    );
    if (!cat) throw new BadRequestException('That category does not exist');
    return cat.id;
  }

  private price(value: unknown, label = 'Price'): number {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0 || n > MAX_PRICE) {
      throw new BadRequestException(`${label} must be more than zero`);
    }
    return Math.round(n * 100) / 100;
  }

  async listMine(userId: string, q: any) {
    const provider = await this.providerOf(userId);
    const { perPage, offset } = paging(q, 50);
    return this.db.query(
      `SELECT ${PRODUCT_FIELDS} FROM products WHERE vendor_id = $1
       ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [provider.id, perPage, offset],
    );
  }

  async createMine(userId: string, data: any) {
    const provider = await this.providerOf(userId);
    if (provider.status !== 'verified') {
      throw new ForbiddenException(
        'Your account needs to be approved before you can list products',
      );
    }
    const name = String(data?.name ?? '').trim().slice(0, 200);
    if (!name) throw new BadRequestException('Product name is required');
    const price = this.price(data?.price);
    const categoryId = await this.resolveCategory(data?.category_id ?? data?.category);

    const id = randomUUID();
    await this.db.query(
      `INSERT INTO products
         (id, name, description, price, compare_price, category_id, vendor_name, vendor_id,
          image_url, images, rating, review_count, order_count, status, is_featured, tags, city, created_at, updated_at)
       VALUES ($1,$2,$3,$4,NULL,$5,$6,$7,$8,NULL,0,0,0,'active',false,$9,$10,NOW(),NOW())`,
      [
        id,
        name,
        String(data?.description ?? '').trim().slice(0, 2000) || null,
        price,
        categoryId,
        provider.business_name || 'Vendor',
        provider.id,
        String(data?.image_url ?? '').trim() || null,
        String(data?.tags ?? '').trim().slice(0, 300) || null,
        String(data?.city ?? provider.city ?? '').trim() || null,
      ],
    );
    return this.db.queryOne(`SELECT ${PRODUCT_FIELDS} FROM products WHERE id = $1`, [id]);
  }

  private async ownProduct(userId: string, productId: string) {
    const provider = await this.providerOf(userId);
    const product = await this.db.queryOne<any>(
      `SELECT id FROM products WHERE id = $1 AND vendor_id = $2`,
      [productId, provider.id],
    );
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async updateMine(userId: string, productId: string, data: any) {
    await this.ownProduct(userId, productId);
    const sets: string[] = [];
    const params: any[] = [];
    const set = (col: string, value: any) => {
      params.push(value);
      sets.push(`${col} = $${params.length}`);
    };

    if (data?.name !== undefined) {
      const name = String(data.name).trim().slice(0, 200);
      if (!name) throw new BadRequestException('Product name is required');
      set('name', name);
    }
    if (data?.description !== undefined) {
      set('description', String(data.description ?? '').trim().slice(0, 2000) || null);
    }
    if (data?.price !== undefined) set('price', this.price(data.price));
    if (data?.category_id !== undefined || data?.category !== undefined) {
      set('category_id', await this.resolveCategory(data.category_id ?? data.category));
    }
    if (data?.image_url !== undefined) set('image_url', String(data.image_url ?? '').trim() || null);
    if (data?.status !== undefined) {
      // A seller can show or hide their own listing, nothing else.
      if (!['active', 'inactive'].includes(data.status)) {
        throw new BadRequestException('Invalid status');
      }
      set('status', data.status);
    }

    if (sets.length) {
      params.push(productId);
      await this.db.query(
        `UPDATE products SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length}`,
        params,
      );
    }
    return this.db.queryOne(`SELECT ${PRODUCT_FIELDS} FROM products WHERE id = $1`, [productId]);
  }

  /** Deletes the listing, or archives it if it has ever been ordered. */
  async deleteMine(userId: string, productId: string) {
    await this.ownProduct(userId, productId);
    const ordered = await this.db.queryOne(
      `SELECT 1 FROM order_items WHERE product_id = $1 LIMIT 1`,
      [productId],
    );
    if (ordered) {
      await this.db.query(
        `UPDATE products SET status = 'inactive', updated_at = NOW() WHERE id = $1`,
        [productId],
      );
      return { ok: true, archived: true };
    }
    await this.db.query(`DELETE FROM products WHERE id = $1`, [productId]);
    return { ok: true, archived: false };
  }
}
