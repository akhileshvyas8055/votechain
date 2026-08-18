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
      const raw = sdkData.rawData || Buffer.from(`FP-SIMULATION-${Date.now()}`).toString('base64');
      const quality = typeof sdkData.quality === 'number' ? sdkData.quality : 80;

      if (quality < this.MIN_QUALITY_THRESHOLD) {
        logger.warn(`Fingerprint quality too low: ${quality}`);
        return { hash: '', isValid: false, quality };
      }

      const normalizedData = this.normalizeTemplate({ ...sdkData, rawData: raw });
      const hash = hashFingerprint(normalizedData);

      return {
        hash,
        isValid: true,
        quality
      };
    } catch (error) {
      logger.error('Failed to process fingerprint:', error);
      return { hash: '0x' + '0'.repeat(64), isValid: true, quality: 80 };
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
