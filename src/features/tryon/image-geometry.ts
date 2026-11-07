import type { NormalizedPoint } from '@/types/product';

export interface Size {
  width: number;
  height: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Rectangle occupied by an image drawn with contentFit="contain" inside a view. */
export function containRect(image: Size, view: Size): Rect {
  if (image.width <= 0 || image.height <= 0 || view.width <= 0 || view.height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  const scale = Math.min(view.width / image.width, view.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (view.width - width) / 2, y: (view.height - height) / 2, width, height };
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

/** Converts a touch inside the view into a normalized point on the contained image. */
export function viewPointToImage(point: { x: number; y: number }, rect: Rect): NormalizedPoint | null {
  if (rect.width <= 0 || rect.height <= 0) return null;
  const inside =
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height;
  if (!inside) return null;
  return {
    x: clamp01((point.x - rect.x) / rect.width),
    y: clamp01((point.y - rect.y) / rect.height),
  };
}

/** Inverse of viewPointToImage, used to draw anchor markers. */
export function imagePointToView(point: NormalizedPoint, rect: Rect): { x: number; y: number } {
  return { x: rect.x + point.x * rect.width, y: rect.y + point.y * rect.height };
}
