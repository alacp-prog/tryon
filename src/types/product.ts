import { z } from 'zod';

export const PRODUCT_CATEGORIES = ['haut', 'bas', 'robe', 'veste', 'accessoire'] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  haut: 'Haut',
  bas: 'Bas',
  robe: 'Robe',
  veste: 'Veste',
  accessoire: 'Accessoire',
};

/** Normalized (0..1) point on an image, as seen on screen. */
export interface NormalizedPoint {
  x: number;
  y: number;
}

export interface TryOnImage {
  productId: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  leftShoulder: NormalizedPoint;
  rightShoulder: NormalizedPoint;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  tryOnImage: TryOnImage | null;
}

/** Form validation for US12 (ajout produit). Price comes from a text input. */
export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères.')
    .max(120, 'Le nom ne doit pas dépasser 120 caractères.'),
  description: z.string().trim().max(2000, 'La description est trop longue (2000 max).'),
  price: z
    .string()
    .trim()
    .min(1, 'Le prix est obligatoire.')
    .transform((value) => Number(value.replace(',', '.')))
    .pipe(
      z
        .number({ error: 'Le prix doit être un nombre.' })
        .min(0, 'Le prix ne peut pas être négatif.')
        .max(100000, 'Le prix est trop élevé.')
    ),
  category: z.enum(PRODUCT_CATEGORIES, { error: 'Choisissez une catégorie.' }),
});

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormValues = z.output<typeof productFormSchema>;

export const loginSchema = z.object({
  email: z.email('Adresse e-mail invalide.').trim(),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères.'),
});

export type LoginValues = z.infer<typeof loginSchema>;

/** Constraints for the try-on PNG imported in US18. */
export const TRYON_IMAGE_RULES = {
  minWidth: 300,
  minHeight: 300,
  maxBytes: 5 * 1024 * 1024,
} as const;

export const anchorsSchema = z
  .object({
    leftShoulder: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
    rightShoulder: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }),
  })
  .refine((a) => a.leftShoulder.x < a.rightShoulder.x, {
    message: 'L’épaule gauche doit être à gauche de l’épaule droite.',
  });

/** Returns the first validation message of a zod error, for display in forms. */
export function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? 'Données invalides.';
}
