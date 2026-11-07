import { PRODUCT_CATEGORIES, type Product, type ProductCategory, type TryOnImage } from '@/types/product';

export interface TryOnImageRow {
  product_id: string;
  image_url: string;
  image_width: number;
  image_height: number;
  anchor_left_shoulder_x: number;
  anchor_left_shoulder_y: number;
  anchor_right_shoulder_x: number;
  anchor_right_shoulder_y: number;
}

export interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  category: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  product_tryon_images?: TryOnImageRow | TryOnImageRow[] | null;
}

export function toTryOnImage(row: TryOnImageRow): TryOnImage {
  return {
    productId: row.product_id,
    imageUrl: row.image_url,
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    leftShoulder: { x: row.anchor_left_shoulder_x, y: row.anchor_left_shoulder_y },
    rightShoulder: { x: row.anchor_right_shoulder_x, y: row.anchor_right_shoulder_y },
  };
}

function toCategory(value: string): ProductCategory {
  return (PRODUCT_CATEGORIES as readonly string[]).includes(value)
    ? (value as ProductCategory)
    : 'haut';
}

/** Supabase returns a 1-1 relation either as an object or a one-element array. */
function firstTryOnRow(value: ProductRow['product_tryon_images']): TryOnImageRow | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export function toProduct(row: ProductRow): Product {
  const tryOnRow = firstTryOnRow(row.product_tryon_images);
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price),
    category: toCategory(row.category),
    imageUrl: row.image_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    tryOnImage: tryOnRow ? toTryOnImage(tryOnRow) : null,
  };
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2).replace('.', ',')} TND`;
}
