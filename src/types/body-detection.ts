export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface DetectionResult {
  originalUri: string;
  processedUri: string;
  hasBody: boolean;
  coverage: number; // percentage 0-100
  bbox: BoundingBox | null;
  processingTimeMs?: number;
  /** True only when the background was actually replaced (Remove.bg). */
  backgroundRemoved: boolean;
  /** False when on-device body detection is not available (web, outdated build). */
  detectionAvailable: boolean;
}

export type BackgroundStyle = 'white' | 'lightGray' | 'original' | 'studioGradient';

