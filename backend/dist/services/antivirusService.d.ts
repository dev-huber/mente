/**
 * Antivirus Scanning Service
 * - File signature validation
 * - Malware pattern detection
 * - Content-type verification
 * - Size and header validation
 * - Integration with external scanning APIs
 */
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
export declare class AntivirusService {
    private logger;
    private config;
    private readonly MALICIOUS_SIGNATURES;
    private readonly AUDIO_SIGNATURES;
    constructor(config?: VirusScanConfig);
    /**
     * Comprehensive file scanning with multiple validation layers
     */
    scanFile(fileData: FileData): Promise<ScanResult>;
    /**
     * Validates basic file properties
     */
    private validateBasicProperties;
    /**
     * Validates file signature against known audio formats
     */
    private validateFileSignature;
    /**
     * Validates file header structure
     */
    private validateFileHeader;
    /**
     * Validates MP3 header structure
     */
    private validateMp3Header;
    /**
     * Validates WAV header structure
     */
    private validateWavHeader;
    /**
     * Validates MP4 header structure
     */
    private validateMp4Header;
    /**
     * Analyzes content for suspicious patterns
     */
    private analyzeContentPatterns;
    /**
     * Performs external antivirus scanning
     */
    private performExternalScan;
    /**
     * Calculates overall confidence score
     */
    private calculateConfidence;
    /**
     * Creates standardized scan result
     */
    private createScanResult;
    /**
     * Generates file hash for caching/tracking
     */
    static generateFileHash(buffer: Buffer): string;
}
export declare const antivirusService: AntivirusService;
export {};
//# sourceMappingURL=antivirusService.d.ts.map