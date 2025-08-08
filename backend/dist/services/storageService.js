"use strict";
/**
 * Azure Blob Storage service for audio file management with defensive patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioStorageService = exports.AudioStorageService = void 0;
exports.createAudioStorageService = createAudioStorageService;
const storage_blob_1 = require("@azure/storage-blob");
const logger_1 = require("../utils/logger");
/**
 * Defensive Azure Blob Storage client with retry logic and comprehensive error handling
 */
class AudioStorageService {
    blobServiceClient;
    containerName;
    maxRetries;
    retryDelayMs;
    constructor(config) {
        this.validateConfig(config);
        this.blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(config.connectionString);
        this.containerName = config.containerName;
        this.maxRetries = config.maxRetries;
        this.retryDelayMs = config.retryDelayMs;
        logger_1.logger.info('Audio storage service initialized', {
            containerName: this.containerName,
            maxRetries: this.maxRetries
        });
    }
    /**
     * Upload audio file to blob storage with metadata and retry logic
     */
    async uploadAudioFile(fileBuffer, fileName, metadata, contentType = 'audio/mpeg') {
        const uploadContext = {
            fileName,
            fileSize: fileBuffer.length,
            contentType
        };
        logger_1.logger.info('Starting blob upload', uploadContext);
        try {
            // Validate inputs
            const validation = this.validateUploadInputs(fileBuffer, fileName, metadata);
            if (!validation.success) {
                return validation;
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
            const container = containerClient.data;
            const blockBlobClient = container.getBlockBlobClient(blobName);
            // Upload with retry logic
            let lastError = null;
            for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
                try {
                    logger_1.logger.info('Upload attempt', {
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
                    logger_1.logger.info('Blob upload successful', {
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
                }
                catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    logger_1.logger.warn('Upload attempt failed', {
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
            logger_1.logger.error('All upload attempts failed', {
                ...uploadContext,
                attempts: this.maxRetries,
                finalError: lastError?.message
            });
            return {
                success: false,
                error: `Upload failed after ${this.maxRetries} attempts: ${lastError?.message}`
            };
        }
        catch (error) {
            logger_1.logger.error('Unexpected storage error', {
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
    async downloadAudioFile(blobName) {
        logger_1.logger.info('Starting blob download', { blobName });
        try {
            const containerClient = await this.getContainerClient();
            if (!containerClient.success) {
                return {
                    success: false,
                    error: `Container access failed: ${containerClient.error}`
                };
            }
            const container = containerClient.data;
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
            logger_1.logger.info('Blob download successful', {
                blobName,
                downloadSize: downloadResponse.length
            });
            return {
                success: true,
                data: downloadResponse
            };
        }
        catch (error) {
            logger_1.logger.error('Blob download failed', {
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
    async deleteAudioFile(blobName) {
        logger_1.logger.info('Starting blob deletion', { blobName });
        try {
            const containerClient = await this.getContainerClient();
            if (!containerClient.success) {
                return {
                    success: false,
                    error: `Container access failed: ${containerClient.error}`
                };
            }
            const container = containerClient.data;
            const blockBlobClient = container.getBlockBlobClient(blobName);
            // Delete blob
            const deleteResponse = await blockBlobClient.deleteIfExists();
            if (deleteResponse.succeeded) {
                logger_1.logger.info('Blob deletion successful', { blobName });
                return {
                    success: true,
                    data: true
                };
            }
            else {
                logger_1.logger.warn('Blob not found for deletion', { blobName });
                return {
                    success: true,
                    data: false // Not an error - blob didn't exist
                };
            }
        }
        catch (error) {
            logger_1.logger.error('Blob deletion failed', {
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
    async listAudioFiles(prefix, maxResults = 100) {
        logger_1.logger.info('Listing blobs', { prefix, maxResults });
        try {
            const containerClient = await this.getContainerClient();
            if (!containerClient.success) {
                return {
                    success: false,
                    error: `Container access failed: ${containerClient.error}`
                };
            }
            const container = containerClient.data;
            const blobNames = [];
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
            logger_1.logger.info('Blob listing completed', {
                prefix,
                resultCount: blobNames.length,
                maxResults
            });
            return {
                success: true,
                data: blobNames
            };
        }
        catch (error) {
            logger_1.logger.error('Blob listing failed', {
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
    validateConfig(config) {
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
    validateUploadInputs(fileBuffer, fileName, metadata) {
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
    async getContainerClient() {
        try {
            const containerClient = this.blobServiceClient.getContainerClient(this.containerName);
            // Ensure container exists
            await containerClient.createIfNotExists({
                access: 'private' // compatível com tipo opcional
            });
            return {
                success: true,
                data: containerClient
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error)
            };
        }
    }
    generateBlobName(originalFileName, fileId) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = this.getFileExtension(originalFileName);
        return `audio/${timestamp}/${fileId}.${extension}`;
    }
    getFileExtension(fileName) {
        const parts = fileName.split('.');
        return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin';
    }
    formatMetadataForStorage(metadata) {
        // Azure blob metadata must be string values
        const formatted = {};
        for (const [key, value] of Object.entries(metadata)) {
            formatted[key] = String(value);
        }
        return formatted;
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.AudioStorageService = AudioStorageService;
// Factory function for creating storage service instance
function createAudioStorageService() {
    const config = {
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
exports.audioStorageService = createAudioStorageService();
