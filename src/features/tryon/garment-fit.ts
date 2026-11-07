import type { NormalizedPoint } from '@/types/product';

export interface Point {
  x: number;
  y: number;
}

export interface GarmentSpec {
  width: number;
  height: number;
  /** Shoulder anchors as seen on the garment image (screen-left / screen-right), 0..1. */
  leftShoulder: NormalizedPoint;
  rightShoulder: NormalizedPoint;
}

export interface GarmentPlacement {
  left: number;
  top: number;
  width: number;
  height: number;
  rotationDeg: number;
  /** Pivot of the rotation, relative to the garment box, in pixels. */
  originX: number;
  originY: number;
}

export interface ShoulderPair {
  left: Point;
  right: Point;
}

const MIN_SHOULDER_DISTANCE_PX = 8;

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** Orders two body shoulders by their on-screen x so they match the garment anchors. */
export function orderShoulders(a: Point, b: Point): ShoulderPair {
  return a.x <= b.x ? { left: a, right: b } : { left: b, right: a };
}

/**
 * Computes where to draw the garment so its shoulder anchors land on the body's shoulders.
 * Returns null when the shoulders are too close to give a stable scale.
 */
export function fitGarmentToShoulders(
  shoulders: ShoulderPair,
  garment: GarmentSpec
): GarmentPlacement | null {
  const bodyDistance = distance(shoulders.left, shoulders.right);
  const anchorLeft = {
    x: garment.leftShoulder.x * garment.width,
    y: garment.leftShoulder.y * garment.height,
  };
  const anchorRight = {
    x: garment.rightShoulder.x * garment.width,
    y: garment.rightShoulder.y * garment.height,
  };
  const garmentDistance = distance(anchorLeft, anchorRight);

  if (bodyDistance < MIN_SHOULDER_DISTANCE_PX || garmentDistance <= 0) {
    return null;
  }

  const scale = bodyDistance / garmentDistance;
  const bodyAngle = Math.atan2(
    shoulders.right.y - shoulders.left.y,
    shoulders.right.x - shoulders.left.x
  );
  const garmentAngle = Math.atan2(anchorRight.y - anchorLeft.y, anchorRight.x - anchorLeft.x);
  const originX = anchorLeft.x * scale;
  const originY = anchorLeft.y * scale;

  return {
    left: shoulders.left.x - originX,
    top: shoulders.left.y - originY,
    width: garment.width * scale,
    height: garment.height * scale,
    rotationDeg: ((bodyAngle - garmentAngle) * 180) / Math.PI,
    originX,
    originY,
  };
}

/** Beyond this jump (relative to shoulder width) the person moved: snap instead of easing. */
const SNAP_RATIO = 0.8;

function lerp(from: Point, to: Point, alpha: number): Point {
  return { x: from.x + (to.x - from.x) * alpha, y: from.y + (to.y - from.y) * alpha };
}

/**
 * Exponential smoothing of shoulder positions to remove detector jitter (US07).
 * `alpha` in (0, 1]: higher follows faster, lower is steadier.
 */
export function smoothShoulders(
  previous: ShoulderPair | null,
  next: ShoulderPair,
  alpha: number
): ShoulderPair {
  if (!previous) return next;
  const width = Math.max(distance(next.left, next.right), MIN_SHOULDER_DISTANCE_PX);
  const jump = Math.max(distance(previous.left, next.left), distance(previous.right, next.right));
  if (jump > width * SNAP_RATIO) return next;

  const clamped = Math.min(Math.max(alpha, 0.01), 1);
  return {
    left: lerp(previous.left, next.left, clamped),
    right: lerp(previous.right, next.right, clamped),
  };
}
