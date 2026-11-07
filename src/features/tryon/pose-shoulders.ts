import { getLandmark, projectLandmark, type Landmark } from 'expo-mediapipe-pose/core';

import { orderShoulders, type ShoulderPair } from '@/features/tryon/garment-fit';

export const MIN_SHOULDER_VISIBILITY = 0.5;

export interface Size {
  width: number;
  height: number;
}

function isVisible(landmark: Landmark | undefined): landmark is Landmark {
  if (!landmark) return false;
  return (landmark.visibility ?? 0) >= MIN_SHOULDER_VISIBILITY;
}

/**
 * Extracts both shoulders from a pose and projects them into an aspect-fill view
 * (same mapping as the camera preview and an `expo-image` with contentFit="cover").
 */
export function shouldersInView(
  pose: { landmarks: readonly Landmark[] },
  imageSize: Size,
  viewSize: Size
): ShoulderPair | null {
  if (viewSize.width <= 0 || viewSize.height <= 0) return null;
  if (imageSize.width <= 0 || imageSize.height <= 0) return null;

  const frame = { landmarks: [...pose.landmarks] };
  const left = getLandmark(frame, 'leftShoulder');
  const right = getLandmark(frame, 'rightShoulder');
  if (!isVisible(left) || !isVisible(right)) return null;

  return orderShoulders(
    projectLandmark(left, imageSize, viewSize),
    projectLandmark(right, imageSize, viewSize)
  );
}
