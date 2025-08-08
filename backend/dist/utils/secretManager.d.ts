/**
 * Defensive Secret Management Service
 * - Validates secret strength and source
 * - Implements key rotation capability
 * - Provides secure defaults
 * - Comprehensive error handling
 */
interface SecretConfig {
    source: 'environment' | 'azure-keyvault' | 'kubernetes';
    minLength: number;
    rotationIntervalHours: number;
    fallbackSecret?: string;
}
export declare class SecretManager {
    private logger;
    private config;
    private currentSecret?;
    private secretCreatedAt?;
    constructor(config?: SecretConfig);
    /**
     * Retrieves and validates JWT secret with comprehensive security checks
     */
    getJwtSecret(): Promise<string>;
    /**
     * Validates secret strength and security requirements
     */
    private validateSecret;
    /**
     * Calculates Shannon entropy of the secret
     */
    private calculateEntropy;
    /**
     * Checks for common weak patterns in secrets
     */
    private hasCommonPatterns;
    /**
     * Retrieves secret from configured source
     */
    private getSecretFromSource;
    /**
     * Gets secret from environment variables with validation
     */
    private getFromEnvironment;
    /**
     * Gets secret from Azure Key Vault (placeholder implementation)
     */
    private getFromAzureKeyVault;
    /**
     * Gets secret from Kubernetes secret (placeholder implementation)
     */
    private getFromKubernetesSecret;
    /**
     * Checks if secret should be rotated based on age
     */
    private shouldRotateSecret;
    /**
     * Rotates secret (placeholder for future implementation)
     */
    private rotateSecret;
    /**
     * Generates cryptographically secure random secret
     */
    static generateSecureSecret(length?: number): string;
}
export declare const secretManager: SecretManager;
export {};
//# sourceMappingURL=secretManager.d.ts.map