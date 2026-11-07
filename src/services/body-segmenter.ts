import { boxCoverage, landmarksToBox } from '@/features/studio/body-box';
import { isNativeModuleAvailable } from '@/lib/native-modules';
import { ensureLocalFile } from '@/services/local-file';
import { BoundingBox, DetectionResult } from '@/types/body-detection';

let storedApiKey: string = '';

export function setApiKey(key: string) {
  storedApiKey = key.trim();
}

export function getApiKey(): string {
  return storedApiKey;
}

interface BodyDetection {
  available: boolean;
  hasBody: boolean;
  bbox: BoundingBox | null;
}

const UNAVAILABLE: BodyDetection = {
  available: false,
  hasBody: false,
  bbox: null,
};

/** Real body detection with MediaPipe; reports `available: false` when the module is missing. */
async function detectBody(imageUri: string): Promise<BodyDetection> {
  if (!isNativeModuleAvailable('pose')) return UNAVAILABLE;

  const localUri = await ensureLocalFile(imageUri, 'studio-source');
  // Loaded lazily: the package registers native views at import time.
  const { analyzePoseImage } = await import('expo-mediapipe-pose');
  const detection = await analyzePoseImage(localUri, {
    maxImageDimension: 1024,
  });
  const bbox = landmarksToBox(detection.landmarks);
  return { available: true, hasBody: bbox !== null, bbox };
}

async function detectBodySafely(imageUri: string): Promise<BodyDetection> {
  try {
    return await detectBody(imageUri);
  } catch {
    return UNAVAILABLE;
  }
}

async function readRemoveBgError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.errors?.[0]?.title ?? `Code ${response.status}`;
  } catch {
    return `Code ${response.status}`;
  }
}

/**
 * Replaces the background with Remove.bg (API key provided by the user) and detects the body.
 */
export async function processWithRemoveBg(
  base64OrUri: string,
  apiKey: string,
  bgColor: string = '#FFFFFF',
  originalUri: string = base64OrUri
): Promise<DetectionResult> {
  const startTime = Date.now();

  const formData = new FormData();
  if (/^https?:\/\//.test(base64OrUri)) {
    formData.append('image_url', base64OrUri);
  } else {
    formData.append('image_file_b64', base64OrUri.replace(/^data:image\/\w+;base64,/, ''));
  }
  formData.append('size', 'auto');
  const hexColor = bgColor.replace('#', '');
  formData.append('bg_color', hexColor.toLowerCase() === 'ffffff' ? 'white' : hexColor);

  const [response, body] = await Promise.all([
    fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: formData,
    }),
    detectBodySafely(originalUri),
  ]);

  if (!response.ok) {
    throw new Error(`Erreur Remove.bg : ${await readRemoveBgError(response)}`);
  }

  const blob = await response.blob();
  const processedUri = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return {
    originalUri,
    processedUri,
    hasBody: body.hasBody,
    coverage: boxCoverage(body.bbox),
    bbox: body.bbox,
    processingTimeMs: Date.now() - startTime,
    backgroundRemoved: true,
    detectionAvailable: body.available,
  };
}

/** On-device analysis only: detects the body, keeps the original background. */
export async function processLocally(imageUri: string): Promise<DetectionResult> {
  const startTime = Date.now();
  const body = await detectBody(imageUri);

  return {
    originalUri: imageUri,
    processedUri: imageUri,
    hasBody: body.hasBody,
    coverage: boxCoverage(body.bbox),
    bbox: body.bbox,
    processingTimeMs: Date.now() - startTime,
    backgroundRemoved: false,
    detectionAvailable: body.available,
  };
}
