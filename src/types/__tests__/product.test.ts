import { anchorsSchema, loginSchema, productFormSchema } from '@/types/product';

describe('productFormSchema', () => {
  const valid = { name: 'Chemise lin', description: '', price: '49,90', category: 'haut' };

  it('accepts a comma decimal price', () => {
    const result = productFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
    expect(result.data?.price).toBeCloseTo(49.9);
  });

  it.each([
    [{ ...valid, price: '' }, 'Le prix est obligatoire.'],
    [{ ...valid, price: 'abc' }, 'Le prix doit être un nombre.'],
    [{ ...valid, price: '-3' }, 'Le prix ne peut pas être négatif.'],
    [{ ...valid, name: 'A' }, 'Le nom doit contenir au moins 2 caractères.'],
    [{ ...valid, category: undefined }, 'Choisissez une catégorie.'],
  ])('rejects %o', (input, message) => {
    const result = productFormSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });
});

describe('loginSchema', () => {
  it('rejects an invalid e-mail', () => {
    expect(loginSchema.safeParse({ email: 'pas-un-mail', password: 'secret123' }).success).toBe(
      false
    );
  });
});

describe('anchorsSchema', () => {
  it('requires the left shoulder to be left of the right one', () => {
    const result = anchorsSchema.safeParse({
      leftShoulder: { x: 0.8, y: 0.2 },
      rightShoulder: { x: 0.2, y: 0.2 },
    });
    expect(result.success).toBe(false);
  });
});
