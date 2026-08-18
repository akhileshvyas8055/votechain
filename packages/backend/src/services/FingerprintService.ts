import { hashFingerprint } from '../utils/crypto';
import { logger } from '../config/logger';

export interface SDKData {
  sensorType: string;
  templateFormat: string;
  rawData: string; // Base64 encoded
  quality: number;
}

export interface ProcessedFingerprint {
  hash: string;
  isValid: boolean;
  quality: number;
}

export class FingerprintService {
  private static MIN_QUALITY_THRESHOLD = 60; // 0-100 scale

  /**
   * Process and validate fingerprint data from various SDKs.
   * Normalizes the template format before hashing.
   */
  static processFingerprintFromSDK(sdkData: SDKData): ProcessedFingerprint {
    try {
      if (sdkData.quality < this.MIN_QUALITY_THRESHOLD) {
        logger.warn(`Fingerprint quality too low: ${sdkData.quality}`);
        return { hash: '', isValid: false, quality: sdkData.quality };
      }

      // In a real system, you would normalize templates from different sensors 
      // to a standard format (e.g., ISO 19794-2) before hashing.
      // For this demo, we assume the rawData is already a standardized string/buffer
      
      const normalizedData = this.normalizeTemplate(sdkData);
      const hash = hashFingerprint(normalizedData);

      return {
        hash,
        isValid: true,
        quality: sdkData.quality
      };
    } catch (error) {
      logger.error('Failed to process fingerprint:', error);
      return { hash: '', isValid: false, quality: 0 };
    }
  }

  /**
   * Normalize template data based on sensor type.
   */
  private static normalizeTemplate(sdkData: SDKData): string {
    // Placeholder for actual template normalization logic
    // e.g., converting R307 format to ISO standard
    
    if (sdkData.sensorType === 'R503') {
      // Specific logic for R503
      return sdkData.rawData; 
    }
    
    return sdkData.rawData;
  }
}
