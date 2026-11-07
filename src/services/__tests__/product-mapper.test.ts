import { formatPrice, toProduct, type ProductRow } from '@/services/product-mapper';
import { validateTryOnFile } from '@/services/admin-image-picker';

jest.mock('expo', () => ({ requireOptionalNativeModule: () => null }));

const row: ProductRow = {
  id: 'p1',
  name: 'Veste',
  description: null,
  price: '89.50',
  category: 'veste',
  image_url: null,
  is_active: true,
  created_at: '2026-11-07T10:00:00Z',
  product_tryon_images: [
    {
      product_id: 'p1',
      image_url: 'https://cdn/tryon.png',
      image_width: 600,
      image_height: 800,
      anchor_left_shoulder_x: 0.3,
      anchor_left_shoulder_y: 0.15,
      anchor_right_shoulder_x: 0.7,
      anchor_right_shoulder_y: 0.15,
    },
  ],
};

describe('toProduct', () => {
  it('maps a row with its try-on image', () => {
    const product = toProduct(row);
    expect(product.price).toBe(89.5);
    expect(product.description).toBe('');
    expect(product.tryOnImage?.leftShoulder).toEqual({ x: 0.3, y: 0.15 });
  });

  it('marks products without try-on image as not tryable', () => {
    expect(toProduct({ ...row, product_tryon_images: [] }).tryOnImage).toBeNull();
    expect(toProduct({ ...row, product_tryon_images: null }).tryOnImage).toBeNull();
  });
});

describe('formatPrice', () => {
  it('uses a comma and TND', () => {
    expect(formatPrice(12)).toBe('12,00 TND');
  });
});

describe('validateTryOnFile', () => {
  const png = { uri: 'file:///a.png', mimeType: 'image/png', width: 800, height: 1000, fileSize: 1000 };

  it('accepts a large enough PNG', () => {
    expect(validateTryOnFile(png)).toBeNull();
  });

  it('rejects JPEG, tiny and heavy files', () => {
    expect(validateTryOnFile({ ...png, mimeType: 'image/jpeg' })).toMatch(/PNG/);
    expect(validateTryOnFile({ ...png, width: 100 })).toMatch(/trop petite/);
    expect(validateTryOnFile({ ...png, fileSize: 6 * 1024 * 1024 })).toMatch(/trop lourde/);
  });
});
