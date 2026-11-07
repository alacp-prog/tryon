import type { BoundingBox } from '@/types/body-detection';

export interface NormalizedLandmark {
  x: number;
  y: number;
  visibility?: number;
}

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

/**
 * Bounding box (in % of the image) around the visible body landmarks,
 * padded by `margin` (fraction of the image) so hair and feet are included.
 */
export function landmarksToBox(
  landmarks: readonly NormalizedLandmark[],
  minVisibility = 0.5,
  margin = 0.04
): BoundingBox | null {
  const visible = landmarks.filter((point) => (point.visibility ?? 0) >= minVisibility);
  if (visible.length < 4) return null;

  const xs = visible.map((point) => point.x);
  const ys = visible.map((point) => point.y);
  const left = clampPercent((Math.min(...xs) - margin) * 100);
  const top = clampPercent((Math.min(...ys) - margin * 2) * 100);
  const right = clampPercent((Math.max(...xs) + margin) * 100);
  const bottom = clampPercent((Math.max(...ys) + margin) * 100);

  if (right <= left || bottom <= top) return null;
  return { x: left, y: top, width: right - left, height: bottom - top };
}

/** Share of the image covered by the box, rounded percent. */
export function boxCoverage(box: BoundingBox | null): number {
  if (!box) return 0;
  return Math.round((box.width * box.height) / 100);
}
