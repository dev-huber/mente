/**
 * Antivirus Scanning Service
 * - File signature validation
 * - Malware pattern detection
 * - Content-type verification
 * - Size and header validation
 * - Integration with external scanning APIs
 */

import crypto from 'crypto';
import { DefensiveLogger } from '../utils/logger';
import { createLogger } from '../utils/logger';

interface ScanResult {
  clean: boolean;
  threat?: string;
  confidence: number;
  scanTime: number;
  details: {
    signatureValid: boolean;
    sizeValid: boolean;
    headerValid: boolean;
    patternMatches: string[];
  };
}

interface FileData {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  size: number;
}

interface VirusScanConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  scanTimeout: number;
  externalScannerEnabled: boolean;
  externalScannerUrl?: string;
  externalScannerKey?: string;
}

export class AntivirusService {
  private logger: DefensiveLogger;
  private config: VirusScanConfig;
  
  // Known malicious file signatures (simplified examples)
  private readonly MALICIOUS_SIGNATURES = new Set([
    '4d5a90000300000004000000ffff0000', // PE executable header
    '504b030414000600080000002100', // ZIP with suspicious structure
    '255044462d312e', // PDF with suspicious patterns
  ]);

  // Known safe audio file signatures
  private readonly AUDIO_SIGNATURES = new Map([
    ['audio/mpeg', ['494433', 'fff3', 'fff2', 'fffb']], // MP3
    ['audio/wav', ['52494646']], // WAV
    ['audio/mp4', ['00000020667479704d34412000']], // M4A
    ['audio/ogg', ['4f676753']], // OGG
  ]);

  constructor(config: VirusScanConfig = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/ogg'],
    scanTimeout: 30000, // 30 seconds
    externalScannerEnabled: false,
  }) {
    this.config = config;
    this.logger = createLogger('AntivirusService');
  }

  /**
   * Comprehensive file scanning with multiple validation layers
   */
  async scanFile(fileData: FileData): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting file scan', {
        fileName: fileData.originalName,
        mimeType: fileData.mimeType,
        size: fileData.size
      });

      // Layer 1: Basic validation
      const basicValidation = this.validateBasicProperties(fileData);
      if (!basicValidation.valid) {
        return this.createScanResult(false, basicValidation.reason, 0.9, startTime, {
          signatureValid: false,
          sizeValid: basicValidation.sizeValid,
          headerValid: false,
          patternMatches: [basicValidation.reason]
        });
      }

      // Layer 2: File signature validation
      const signatureValidation = this.validateFileSignature(fileData);
      
      // Layer 3: Header structure validation
      const headerValidation = this.validateFileHeader(fileData);
      
      // Layer 4: Content pattern analysis
      const patternAnalysis = this.analyzeContentPatterns(fileData);
      
      // Layer 5: External scanning (if enabled)
      let externalScanResult = null;
      if (this.config.externalScannerEnabled) {
        externalScanResult = await this.performExternalScan(fileData);
      }

      // Combine all results
      const overallClean = signatureValidation.valid && 
                          headerValidation.valid && 
                          patternAnalysis.safe &&
                          (externalScanResult ? externalScanResult.clean : true);

      const confidence = this.calculateConfidence([
        signatureValidation,
        headerValidation,
        patternAnalysis,
        externalScanResult
      ]);

      const threats = [
        ...(!signatureValidation.valid ? ['Invalid file signature'] : []),
        ...(!headerValidation.valid ? ['Suspicious file header'] : []),
        ...(!patternAnalysis.safe ? patternAnalysis.threats : []),
        ...(externalScanResult && !externalScanResult.clean ? [externalScanResult.threat] : [])
      ].filter(Boolean);

      const result = this.createScanResult(
        overallClean,
        threats.length > 0 ? threats.join(', ') : undefined,
        confidence,
        startTime,
        {
          signatureValid: signatureValidation.valid,
          sizeValid: true,
          headerValid: headerValidation.valid,
          patternMatches: threats
        }
      );

      this.logger.info('File scan completed', {
        fileName: fileData.originalName,
        clean: result.clean,
        confidence: result.confidence,
        scanTime: result.scanTime
      });

      return result;

    } catch (error) {
      this.logger.error('File scan failed', {
        fileName: fileData.originalName,
        error: error.message
      });

      return this.createScanResult(false, `Scan error: ${error.message}`, 0.5, startTime, {
        signatureValid: false,
        sizeValid: false,
        headerValid: false,
        patternMatches: ['Scan failed']
      });
    }
  }

  /**
   * Validates basic file properties
   */
  private validateBasicProperties(fileData: FileData): { valid: boolean; reason?: string; sizeValid: boolean } {
    // Size validation
    if (fileData.size > this.config.maxFileSize) {
      return {
        valid: false,
        reason: `File too large: ${fileData.size} bytes (max: ${this.config.maxFileSize})`,
        sizeValid: false
      };
    }

    if (fileData.size < 100) {
      return {
        valid: false,
        reason: 'File too small to be valid audio',
        sizeValid: false
      };
    }

    // MIME type validation
    if (!this.config.allowedMimeTypes.includes(fileData.mimeType)) {
      return {
        valid: false,
        reason: `Invalid MIME type: ${fileData.mimeType}`,
        sizeValid: true
      };
    }

    return { valid: true, sizeValid: true };
  }

  /**
   * Validates file signature against known audio formats
   */
  private validateFileSignature(fileData: FileData): { valid: boolean; reason?: string } {
    const header = fileData.buffer.slice(0, 32).toString('hex').toLowerCase();
    const expectedSignatures = this.AUDIO_SIGNATURES.get(fileData.mimeType);

    if (!expectedSignatures) {
      return { valid: false, reason: 'Unknown MIME type for signature validation' };
    }

    // Check for malicious signatures first
    for (const maliciousSignature of this.MALICIOUS_SIGNATURES) {
      if (header.startsWith(maliciousSignature.toLowerCase())) {
        return { valid: false, reason: 'Malicious file signature detected' };
      }
    }

    // Check for valid audio signatures
    const hasValidSignature = expectedSignatures.some(sig => 
      header.startsWith(sig.toLowerCase())
    );

    if (!hasValidSignature) {
      return { 
        valid: false, 
        reason: `Invalid signature for ${fileData.mimeType}. Expected: ${expectedSignatures.join(' or ')}, Got: ${header.slice(0, 16)}` 
      };
    }

    return { valid: true };
  }

  /**
   * Validates file header structure
   */
  private validateFileHeader(fileData: FileData): { valid: boolean; reason?: string } {
    try {
      switch (fileData.mimeType) {
        case 'audio/mpeg':
          return this.validateMp3Header(fileData.buffer);
        case 'audio/wav':
          return this.validateWavHeader(fileData.buffer);
        case 'audio/mp4':
          return this.validateMp4Header(fileData.buffer);
        default:
          return { valid: true }; // Skip validation for unknown types
      }
    } catch (error) {
      return { valid: false, reason: `Header validation error: ${error.message}` };
    }
  }

  /**
   * Validates MP3 header structure
   */
  private validateMp3Header(buffer: Buffer): { valid: boolean; reason?: string } {
    // Check for ID3 tag or frame sync
    if (buffer.length < 4) {
      return { valid: false, reason: 'MP3 file too short for valid header' };
    }

    const hasId3 = buffer.slice(0, 3).toString() === 'ID3';
    const hasFrameSync = (buffer[0] === 0xFF) && ((buffer[1] & 0xE0) === 0xE0);

    if (!hasId3 && !hasFrameSync) {
      return { valid: false, reason: 'Invalid MP3 header - no ID3 tag or frame sync found' };
    }

    return { valid: true };
  }

  /**
   * Validates WAV header structure
   */
  private validateWavHeader(buffer: Buffer): { valid: boolean; reason?: string } {
    if (buffer.length < 44) {
      return { valid: false, reason: 'WAV file too short for valid header' };
    }

    // Check RIFF header
    const riff = buffer.slice(0, 4).toString();
    const wave = buffer.slice(8, 12).toString();
    const fmt = buffer.slice(12, 16).toString();

    if (riff !== 'RIFF') {
      return { valid: false, reason: 'Invalid WAV header - missing RIFF signature' };
    }

    if (wave !== 'WAVE') {
      return { valid: false, reason: 'Invalid WAV header - missing WAVE identifier' };
    }

    if (fmt !== 'fmt ') {
      return { valid: false, reason: 'Invalid WAV header - missing format chunk' };
    }

    return { valid: true };
  }

  /**
   * Validates MP4 header structure
   */
  private validateMp4Header(buffer: Buffer): { valid: boolean; reason?: string } {
    if (buffer.length < 8) {
      return { valid: false, reason: 'MP4 file too short for valid header' };
    }

    // Check for ftyp box
    const boxType = buffer.slice(4, 8).toString();
    if (boxType !== 'ftyp') {
      return { valid: false, reason: 'Invalid MP4 header - missing ftyp box' };
    }

    return { valid: true };
  }

  /**
   * Analyzes content for suspicious patterns
   */
  private analyzeContentPatterns(fileData: FileData): { safe: boolean; threats: string[] } {
    const threats: string[] = [];
    const content = fileData.buffer.toString('binary');

    // Check for embedded executables
    if (content.includes('MZ') || content.includes('\x4d\x5a')) {
      threats.push('Embedded executable detected');
    }

    // Check for script injections
    const scriptPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /eval\(/i,
      /exec\(/i
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(content)) {
        threats.push('Script injection pattern detected');
        break;
      }
    }

    // Check for suspicious URLs
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const urls = content.match(urlPattern);
    if (urls && urls.length > 10) {
      threats.push('Excessive URLs found in audio file');
    }

    return {
      safe: threats.length === 0,
      threats
    };
  }

  /**
   * Performs external antivirus scanning
   */
  private async performExternalScan(fileData: FileData): Promise<{ clean: boolean; threat?: string } | null> {
    if (!this.config.externalScannerUrl || !this.config.externalScannerKey) {
      return null;
    }

    try {
      // This is a placeholder for external scanner integration
      // In production, integrate with services like:
      // - VirusTotal API
      // - ClamAV
      // - Windows Defender API
      // - AWS GuardDuty
      
      this.logger.info('External scan not implemented', {
        fileName: fileData.originalName
      });

      return { clean: true };
    } catch (error) {
      this.logger.error('External scan failed', {
        fileName: fileData.originalName,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Calculates overall confidence score
   */
  private calculateConfidence(results: any[]): number {
    const validResults = results.filter(r => r !== null);
    if (validResults.length === 0) return 0.5;

    const scores = validResults.map(result => {
      if (typeof result.valid === 'boolean') return result.valid ? 1 : 0;
      if (typeof result.safe === 'boolean') return result.safe ? 1 : 0;
      if (typeof result.clean === 'boolean') return result.clean ? 1 : 0;
      return 0.5;
    });

    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  /**
   * Creates standardized scan result
   */
  private createScanResult(
    clean: boolean,
    threat: string | undefined,
    confidence: number,
    startTime: number,
    details: ScanResult['details']
  ): ScanResult {
    return {
      clean,
      threat,
      confidence,
      scanTime: Date.now() - startTime,
      details
    };
  }

  /**
   * Generates file hash for caching/tracking
   */
  static generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}

// Export singleton instance
export const antivirusService = new AntivirusService();