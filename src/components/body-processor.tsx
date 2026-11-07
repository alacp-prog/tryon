import { useEffect } from 'react';

import { getApiKey, processLocally, processWithRemoveBg } from '@/services/body-segmenter';
import { DetectionResult } from '@/types/body-detection';

interface BodyProcessorProps {
  imageUri: string | null;
  imageBase64: string | null;
  backgroundColor?: string;
  isProcessing: boolean;
  onResult: (result: DetectionResult) => void;
  onError: (error: string) => void;
}

/** Runs body detection (and Remove.bg when a key is set) whenever processing is requested. */
export function BodyProcessor({
  imageUri,
  imageBase64,
  backgroundColor = '#FFFFFF',
  isProcessing,
  onResult,
  onError,
}: BodyProcessorProps) {
  useEffect(() => {
    if (!isProcessing || !imageUri) return;

    let isMounted = true;

    const process = async () => {
      try {
        const apiKey = getApiKey();
        const result = apiKey
          ? await processWithRemoveBg(imageBase64 || imageUri, apiKey, backgroundColor, imageUri)
          : await processLocally(imageUri);

        if (isMounted) onResult(result);
      } catch (err: unknown) {
        if (isMounted) onError(err instanceof Error ? err.message : String(err));
      }
    };

    process();

    return () => {
      isMounted = false;
    };
  }, [isProcessing, imageUri, imageBase64, backgroundColor, onResult, onError]);

  return null;
}
