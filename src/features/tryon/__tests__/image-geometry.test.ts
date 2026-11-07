import { containRect, imagePointToView, viewPointToImage } from '@/features/tryon/image-geometry';

describe('containRect', () => {
  it('letterboxes a tall image in a wide view', () => {
    expect(containRect({ width: 100, height: 200 }, { width: 400, height: 200 })).toEqual({
      x: 150,
      y: 0,
      width: 100,
      height: 200,
    });
  });

  it('returns an empty rect for unknown sizes', () => {
    expect(containRect({ width: 0, height: 10 }, { width: 10, height: 10 }).width).toBe(0);
  });
});

describe('viewPointToImage / imagePointToView', () => {
  const rect = { x: 150, y: 0, width: 100, height: 200 };

  it('round-trips a point', () => {
    const normalized = viewPointToImage({ x: 175, y: 50 }, rect);
    expect(normalized).toEqual({ x: 0.25, y: 0.25 });
    expect(imagePointToView(normalized!, rect)).toEqual({ x: 175, y: 50 });
  });

  it('ignores touches outside the image', () => {
    expect(viewPointToImage({ x: 10, y: 50 }, rect)).toBeNull();
  });
});
