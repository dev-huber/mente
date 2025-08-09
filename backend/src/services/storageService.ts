/**
 * Azure Blob Storage service for audio file management with defensive patterns
 */

import { BlobServiceClient } from '@azure/storage-blob';
import { logger } from '../utils/logger';

// Storage configuration interfaces
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
export class AudioStorageService {
    private blobServiceClient: BlobServiceClient;
    private containerName: string;
    private maxRetries: number;
    private retryDelayMs: number;

    constructor(config: StorageConfig) {
        this.validateConfig(config);
        
        this.blobServiceClient = BlobServiceClient.fromConnectionString(config.connectionString);
        this.containerName = config.containerName;
        this.maxRetries = config.maxRetries;
        this.retryDelayMs = config.retryDelayMs;

        logger.info('Audio storage service initialized', {
            containerName: this.containerName,
            maxRetries: this.maxRetries
        });
    }

    /**
     * Upload audio file to blob storage with metadata and retry logic
     */
    async uploadAudioFile(
        fileBuffer: Buffer,
        fileName: string,
        metadata: FileMetadata,
        contentType: string = 'audio/mpeg'
    ): Promise<StorageResult<UploadResult>> {
        const uploadContext = {
            fileName,
            fileSize: fileBuffer.length,
            contentType
        };

        logger.info('Starting blob upload', uploadContext);

        try {
            // Validate inputs
            const validation = this.validateUploadInputs(fileBuffer, fileName, metadata);
            if (!validation.success) {
                return {
                    success: false,
                    error: validation.error
                };
            }

            // Generate unique blob name to prevent conflicts
            const blobName = this.generateBlobName(fileName, metadata.fileId);
            
            // Get container client with defensive initialization
            const containerClient = await this.getContainerClient();
            if (!containerClient.success) {
                return {
                    success: false,
                    error: `Container access failed: ${containerClient.error}`
                };
            }

            const container = containerClient.data!;
            const blockBlobClient = container.getBlockBlobClient(blobName);

            // Upload with retry logic
            let lastError: Error | null = null;
            
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    logger.info('Upload attempt', { 
                        ...uploadContext, 
                        attempt, 
                        blobName 
                    });

                    const uploadResponse = await blockBlobClient.uploadData(fileBuffer, {
                        blobHTTPHeaders: {
                            blobContentType: contentType,
                            blobContentDisposition: `attachment; filename="${metadata.originalName}"`
                        },
                        metadata: this.formatMetadataForStorage(metadata),
                        conditions: {
                            ifNoneMatch: '*' // Prevent accidental overwrites
                        }
                    });

                    // Validate upload response
                    if (!uploadResponse.requestId) {
                        throw new Error('Upload response missing request ID');
                    }

                    const result = {
                        blobUrl: blockBlobClient.url,
                        blobName,
                        uploadSize: fileBuffer.length,
                        contentMD5: uploadResponse.contentMD5,
                        etag: uploadResponse.etag
                    };

                    logger.info('Blob upload successful', {
                        ...uploadContext,
                        blobName,
                        blobUrl: result.blobUrl,
                        etag: result.etag,
                        attempt
                    });

                    return {
                        success: true,
                        data: result
                    };

                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    
                    logger.warn('Upload attempt failed', {
                        ...uploadContext,
                        attempt,
                        error: lastError.message,
                        maxRetries: this.maxRetries
                    });

                    // If not the last attempt, wait before retry
                    if (attempt < this.maxRetries) {
                        await this.delay(this.retryDelayMs * attempt);
                    }
                }
            }

            // All attempts failed
            logger.error('All upload attempts failed', {
                ...uploadContext,
                attempts: this.maxRetries,
                finalError: lastError?.message
            });

            return {
                success: false,
                error: `Upload failed after ${this.maxRetries} attempts: ${lastError?.message}`
            };

        } catch (error) {
            logger.error('Unexpected storage error', {
                ...uploadContext,
                error: error instanceof Error ? error.message : String(error)
            });

            return {
                success: false,
                error: `Storage operation failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Download audio file from blob storage
     */
    async downloadAudioFile(blobName: string): Promise<StorageResult<Buffer>> {
        logger.info('Starting blob download', { blobName });

        try {
            const containerClient = await this.getContainerClient();
            if (!containerClient.success) {
                return {
                    success: false,
                    error: `Container access failed: ${containerClient.error}`
                };
            }

            const container = containerClient.data!;
            const blockBlobClient = container.getBlockBlobClient(blobName);

            // Check if blob exists
            const exists = await blockBlobClient.exists();
            if (!exists) {
                return {
                    success: false,
                    error: `Blob not found: ${blobName}`
                };
            }

            // Download blob data
            const downloadResponse = await blockBlobClient.downloadToBuffer();
            
            logger.info('Blob download successful', {
                blobName,
                downloadSize: downloadResponse.length
            });

            return {
                success: true,
                data: downloadResponse
            };

        } catch (error) {
            logger.error('Blob download failed', {
                blobName,
                error: error instanceof Error ? error.message : String(error)
            });

            return {
                success: false,
                error: `Download failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * Delete audio file from blob storage
     */
    async deleteAudioFile(blobName: string): Promise<StorageResult<boolean>> {
        logger.info('Starting blob deletion', { blobName });

        try {
            const containerClient = await this.getContainerClient();
            if (!containerClient.success) {
                return {
                    success: false,
                    error: `Container access failed: ${containerClient.error}`
                };
            }

            const container = containerClient.data!;
            const blockBlobClient = container.getBlockBlobClient(blobName);

            // Delete blob
            const deleteResponse = await blockBlobClient.deleteIfExists();
            
            if (deleteResponse.succeeded) {
                logger.info('Blob deletion successful', { blobName });
                return {
                    success: true,
                    data: true
                };
            } else {
                logger.warn('Blob not found for deletion', { blobName });
                return {
                    success: true,
                    data: false // Not an error - blob didn't exist
                };
            }

        } catch (error) {
            logger.error('Blob deletion failed', {
                blobName,
                error: error instanceof Error ? error.message : String(error)
            });

            return {
                success: false,
                error: `Deletion failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    /**
     * List audio files in container with pagination
     */
    async listAudioFiles(prefix?: string, maxResults: number = 100): Promise<StorageResult<string[]>> {
        logger.info('Listing blobs', { prefix, maxResults });

        try {
            const containerClient = await this.getContainerClient();
            if (!containerClient.success) {
                return {
                    success: false,
                    error: `Container access failed: ${containerClient.error}`
                };
            }

            const container = containerClient.data!;
            const blobNames: string[] = [];

            const listOptions = {
                prefix,
                includeMetadata: false
            };

            for await (const blob of container.listBlobsFlat(listOptions)) {
                blobNames.push(blob.name);
                
                if (blobNames.length >= maxResults) {
                    break;
                }
            }

            logger.info('Blob listing completed', {
                prefix,
                resultCount: blobNames.length,
                maxResults
            });

            return {
                success: true,
                data: blobNames
            };

        } catch (error) {
            logger.error('Blob listing failed', {
                prefix,
                error: error instanceof Error ? error.message : String(error)
            });

            return {
                success: false,
                error: `Listing failed: ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }

    // Private helper methods
    private validateConfig(config: StorageConfig): void {
        if (!config.connectionString) {
            throw new Error('Storage connection string is required');
        }
        if (!config.containerName) {
            throw new Error('Container name is required');
        }
        if (config.maxRetries < 1 || config.maxRetries > 10) {
            throw new Error('maxRetries must be between 1 and 10');
        }
        if (config.retryDelayMs < 100 || config.retryDelayMs > 30000) {
            throw new Error('retryDelayMs must be between 100 and 30000');
        }
    }

    private validateUploadInputs(
        fileBuffer: Buffer,
        fileName: string,
        metadata: FileMetadata
    ): StorageResult<boolean> {
        if (!fileBuffer || fileBuffer.length === 0) {
            return {
                success: false,
                error: 'File buffer is empty'
            };
        }

        if (!fileName || fileName.trim().length === 0) {
            return {
                success: false,
                error: 'File name is required'
            };
        }

        if (!metadata || !metadata.fileId) {
            return {
                success: false,
                error: 'File metadata with fileId is required'
            };
        }

        // Check file size limits (50MB max)
        if (fileBuffer.length > 50 * 1024 * 1024) {
            return {
                success: false,
                error: 'File size exceeds 50MB limit'
            };
        }

        return { success: true };
    }

    private async getContainerClient(): Promise<StorageResult<any>> {
        try {
            const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
            
            // Ensure container exists
            await containerClient.createIfNotExists({
                access: 'private' as any // compatível com tipo opcional
            });

            return {
                success: true,
                data: containerClient
            };

        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }

    private generateBlobName(originalFileName: string, fileId: string): string {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = this.getFileExtension(originalFileName);
        return `audio/${timestamp}/${fileId}.${extension}`;
    }

    private getFileExtension(fileName: string): string {
        const parts = fileName.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin';
    }

    private formatMetadataForStorage(metadata: FileMetadata): Record<string, string> {
        // Azure blob metadata must be string values
        const formatted: Record<string, string> = {};
        
        for (const [key, value] of Object.entries(metadata)) {
            formatted[key] = String(value);
        }

        return formatted;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Factory function for creating storage service instance
export function createAudioStorageService(): AudioStorageService {
    const config: StorageConfig = {
        connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
        containerName: process.env.STORAGE_CONTAINER_NAME || 'audio-files',
        maxRetries: parseInt(process.env.STORAGE_MAX_RETRIES || '3'),
        retryDelayMs: parseInt(process.env.STORAGE_RETRY_DELAY_MS || '1000')
    };

    if (!config.connectionString) {
        throw new Error('AZURE_STORAGE_CONNECTION_STRING environment variable is required');
    }

    return new AudioStorageService(config);
}

// Export singleton instance
export const audioStorageService = createAudioStorageService();
