import { boxCoverage, landmarksToBox } from '@/features/studio/body-box';

const point = (x: number, y: number, visibility = 0.9) => ({
  x,
  y,
  visibility,
});

describe('landmarksToBox', () => {
  it('wraps visible landmarks with a margin, in percent', () => {
    const box = landmarksToBox([
      point(0.4, 0.2),
      point(0.6, 0.2),
      point(0.4, 0.8),
      point(0.6, 0.8),
    ]);
    expect(box).not.toBeNull();
    expect(box!.x).toBeCloseTo(36);
    expect(box!.y).toBeCloseTo(12);
    expect(box!.width).toBeCloseTo(28);
    expect(box!.height).toBeCloseTo(72);
  });

  it('ignores low-visibility points and needs at least four', () => {
    expect(
      landmarksToBox([point(0.4, 0.2), point(0.6, 0.2), point(0.4, 0.8), point(0.1, 0.1, 0.1)])
    ).toBeNull();
  });

  it('clamps the box inside the image', () => {
    const box = landmarksToBox([point(0, 0), point(1, 0), point(0, 1), point(1, 1)]);
    expect(box).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });
});

describe('boxCoverage', () => {
  it('returns the covered share of the image', () => {
    expect(boxCoverage({ x: 0, y: 0, width: 50, height: 50 })).toBe(25);
    expect(boxCoverage(null)).toBe(0);
  });
});
