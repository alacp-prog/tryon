import {
  fitGarmentToShoulders,
  orderShoulders,
  smoothShoulders,
  type GarmentSpec,
} from '@/features/tryon/garment-fit';

const garment: GarmentSpec = {
  width: 400,
  height: 500,
  leftShoulder: { x: 0.25, y: 0.1 },
  rightShoulder: { x: 0.75, y: 0.1 },
};

/** Applies the placement (scale + rotation around origin) to a garment pixel. */
function project(placement: NonNullable<ReturnType<typeof fitGarmentToShoulders>>, px: number, py: number) {
  const scale = placement.width / garment.width;
  const localX = px * scale - placement.originX;
  const localY = py * scale - placement.originY;
  const angle = (placement.rotationDeg * Math.PI) / 180;
  return {
    x: placement.left + placement.originX + localX * Math.cos(angle) - localY * Math.sin(angle),
    y: placement.top + placement.originY + localX * Math.sin(angle) + localY * Math.cos(angle),
  };
}

describe('orderShoulders', () => {
  it('puts the smallest x on the left', () => {
    const pair = orderShoulders({ x: 300, y: 10 }, { x: 100, y: 12 });
    expect(pair.left).toEqual({ x: 100, y: 12 });
    expect(pair.right).toEqual({ x: 300, y: 10 });
  });
});

describe('fitGarmentToShoulders', () => {
  it('scales the garment so its anchors match level shoulders', () => {
    const placement = fitGarmentToShoulders(
      { left: { x: 100, y: 200 }, right: { x: 300, y: 200 } },
      garment
    );
    expect(placement).not.toBeNull();
    // Anchor distance = 200px on the garment, 200px on the body → scale 1.
    expect(placement!.width).toBeCloseTo(400);
    expect(placement!.height).toBeCloseTo(500);
    expect(placement!.rotationDeg).toBeCloseTo(0);
    expect(placement!.left).toBeCloseTo(0);
    expect(placement!.top).toBeCloseTo(150);
  });

  it('maps both garment anchors onto tilted shoulders', () => {
    const shoulders = { left: { x: 120, y: 260 }, right: { x: 280, y: 200 } };
    const placement = fitGarmentToShoulders(shoulders, garment)!;

    const left = project(placement, 0.25 * 400, 0.1 * 500);
    const right = project(placement, 0.75 * 400, 0.1 * 500);
    expect(left.x).toBeCloseTo(120);
    expect(left.y).toBeCloseTo(260);
    expect(right.x).toBeCloseTo(280);
    expect(right.y).toBeCloseTo(200);
  });

  it('returns null when shoulders are too close', () => {
    expect(
      fitGarmentToShoulders({ left: { x: 100, y: 100 }, right: { x: 102, y: 100 } }, garment)
    ).toBeNull();
  });
});

describe('smoothShoulders', () => {
  const previous = { left: { x: 100, y: 100 }, right: { x: 300, y: 100 } };

  it('returns the new pair when there is no history', () => {
    expect(smoothShoulders(null, previous, 0.5)).toBe(previous);
  });

  it('eases small movements', () => {
    const next = { left: { x: 110, y: 100 }, right: { x: 310, y: 100 } };
    const result = smoothShoulders(previous, next, 0.5);
    expect(result.left.x).toBeCloseTo(105);
    expect(result.right.x).toBeCloseTo(305);
  });

  it('snaps on large jumps instead of sliding across the screen', () => {
    const next = { left: { x: 400, y: 100 }, right: { x: 600, y: 100 } };
    expect(smoothShoulders(previous, next, 0.2)).toBe(next);
  });
});
