import { File } from 'expo-file-system';

import { getSupabase } from '@/lib/supabase';
import { toProduct, type ProductRow } from '@/services/product-mapper';
import { type NormalizedPoint, type Product, type ProductFormValues } from '@/types/product';

const BUCKET = 'product-images';
const PRODUCT_SELECT =
  'id, name, description, price, category, image_url, is_active, created_at, product_tryon_images(*)';

export const CATALOG_PAGE_SIZE = 20;

export async function listActiveProducts(page: number): Promise<Product[]> {
  const from = page * CATALOG_PAGE_SIZE;
  const { data, error } = await getSupabase()
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(from, from + CATALOG_PAGE_SIZE - 1);

  if (error) throw new Error('Impossible de charger le catalogue.');
  return (data as ProductRow[]).map(toProduct);
}

export async function listAllProductsForAdmin(): Promise<Product[]> {
  const { data, error } = await getSupabase()
    .from('products')
    .select(PRODUCT_SELECT)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Impossible de charger les produits.');
  return (data as ProductRow[]).map(toProduct);
}

export async function getProduct(id: string): Promise<Product> {
  const { data, error } = await getSupabase()
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('id', id)
    .single();

  if (error || !data) throw new Error('Produit introuvable.');
  return toProduct(data as ProductRow);
}

/** Uploads a local file to the product bucket and returns its public URL. */
async function uploadImage(localUri: string, path: string, contentType: string): Promise<string> {
  const supabase = getSupabase();
  const bytes = await new File(localUri).arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: true });

  if (error) throw new Error('L’envoi de l’image a échoué.');
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function extensionOf(mimeType: string): string {
  return mimeType === 'image/png' ? 'png' : 'jpg';
}

export async function createProduct(
  values: ProductFormValues,
  image: { uri: string; mimeType: string } | null
): Promise<Product> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: values.name,
      description: values.description,
      price: values.price,
      category: values.category,
    })
    .select(PRODUCT_SELECT)
    .single();

  if (error || !data) throw new Error('La création du produit a échoué.');
  const created = toProduct(data as ProductRow);
  if (!image) return created;

  const imageUrl = await uploadImage(
    image.uri,
    `${created.id}/catalog.${extensionOf(image.mimeType)}`,
    image.mimeType
  );
  const { error: updateError } = await supabase
    .from('products')
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq('id', created.id);

  if (updateError) throw new Error('Produit créé, mais l’image n’a pas pu être associée.');
  return { ...created, imageUrl };
}

export interface SaveTryOnImageInput {
  productId: string;
  localUri: string;
  width: number;
  height: number;
  leftShoulder: NormalizedPoint;
  rightShoulder: NormalizedPoint;
}

export async function saveTryOnImage(input: SaveTryOnImageInput): Promise<void> {
  // Cache-busting suffix so clients reload a replaced garment image.
  const imageUrl = await uploadImage(
    input.localUri,
    `${input.productId}/tryon-${Date.now()}.png`,
    'image/png'
  );

  const { error } = await getSupabase()
    .from('product_tryon_images')
    .upsert({
      product_id: input.productId,
      image_url: imageUrl,
      image_width: input.width,
      image_height: input.height,
      anchor_left_shoulder_x: input.leftShoulder.x,
      anchor_left_shoulder_y: input.leftShoulder.y,
      anchor_right_shoulder_x: input.rightShoulder.x,
      anchor_right_shoulder_y: input.rightShoulder.y,
      updated_at: new Date().toISOString(),
    });

  if (error) throw new Error('L’enregistrement de l’image d’essayage a échoué.');
}
