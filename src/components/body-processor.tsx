import { useEffect } from 'react';
import { View } from 'react-native';

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
        let result: DetectionResult;

        if (apiKey) {
          result = await processWithRemoveBg(
            imageBase64 || imageUri,
            apiKey,
            backgroundColor
          );
        } else {
          result = await processLocally(imageUri, backgroundColor);
        }

        if (isMounted) {
          onResult(result);
        }
      } catch (err: unknown) {
        if (isMounted) {
          onError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    process();

    return () => {
      isMounted = false;
    };
  }, [isProcessing, imageUri, imageBase64, backgroundColor, onResult, onError]);

  return <View style={{ display: 'none' }} />;
}
