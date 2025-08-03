/**
 * Azure Blob Storage service for audio file management with defensive patterns
 */
export interface StorageConfig {
    connectionString: string;
    containerName: string;
    maxRetries: number;
    retryDelayMs: number;
}
export interface StorageResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}
export interface UploadResult {
    blobUrl: string;
    blobName: string;
    uploadSize: number;
    contentMD5?: string;
    etag?: string;
}
export interface FileMetadata {
    originalName: string;
    uploadTimestamp: string;
    fileId: string;
    contentType: string;
    fileSize: number;
    [key: string]: string | number;
}
/**
 * Defensive Azure Blob Storage client with retry logic and comprehensive error handling
 */
export declare class AudioStorageService {
    private blobServiceClient;
    private containerName;
    private maxRetries;
    private retryDelayMs;
    constructor(config: StorageConfig);
    /**
     * Upload audio file to blob storage with metadata and retry logic
     */
    uploadAudioFile(fileBuffer: Buffer, fileName: string, metadata: FileMetadata, contentType?: string): Promise<StorageResult<UploadResult>>;
    /**
     * Download audio file from blob storage
     */
    downloadAudioFile(blobName: string): Promise<StorageResult<Buffer>>;
    /**
     * Delete audio file from blob storage
     */
    deleteAudioFile(blobName: string): Promise<StorageResult<boolean>>;
    /**
     * List audio files in container with pagination
     */
    listAudioFiles(prefix?: string, maxResults?: number): Promise<StorageResult<string[]>>;
    private validateConfig;
    private validateUploadInputs;
    private getContainerClient;
    private generateBlobName;
    private getFileExtension;
    private formatMetadataForStorage;
    private delay;
}
export declare function createAudioStorageService(): AudioStorageService;
export declare const audioStorageService: AudioStorageService;
//# sourceMappingURL=storageService.d.ts.map