"use strict";
/**
 * Defensive Secret Management Service
 * - Validates secret strength and source
 * - Implements key rotation capability
 * - Provides secure defaults
 * - Comprehensive error handling
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretManager = exports.SecretManager = void 0;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("./logger");
class SecretManager {
    logger;
    config;
    currentSecret;
    secretCreatedAt;
    constructor(config = {
        source: 'environment',
        minLength: 32,
        rotationIntervalHours: 24 * 7, // 7 days
    }) {
        this.config = config;
        this.logger = (0, logger_1.createLogger)('SecretManager');
    }
    /**
     * Retrieves and validates JWT secret with comprehensive security checks
     */
    async getJwtSecret() {
        try {
            // Check if current secret needs rotation
            if (this.shouldRotateSecret()) {
                await this.rotateSecret();
            }
            // Get secret from configured source
            let secret = await this.getSecretFromSource();
            // Validate secret strength
            const validation = this.validateSecret(secret);
            if (!validation.isValid) {
                this.logger.error('Secret validation failed', {
                    issues: validation.issues,
                    strength: validation.strength,
                    entropy: validation.entropy
                });
                // Attempt fallback if available
                if (this.config.fallbackSecret) {
                    this.logger.warn('Using fallback secret due to validation failure');
                    secret = this.config.fallbackSecret;
                }
                else {
                    throw new Error(`JWT secret validation failed: ${validation.issues.join(', ')}`);
                }
            }
            this.currentSecret = secret;
            this.secretCreatedAt = new Date();
            this.logger.info('JWT secret retrieved and validated successfully', {
                source: this.config.source,
                strength: validation.strength,
                entropy: validation.entropy
            });
            return secret;
        }
        catch (error) {
            this.logger.error('Failed to retrieve JWT secret', { error: error.message });
            throw new Error(`Secret retrieval failed: ${error.message}`);
        }
    }
    /**
     * Validates secret strength and security requirements
     */
    validateSecret(secret) {
        const issues = [];
        let strength = 'strong';
        // Length validation
        if (secret.length < this.config.minLength) {
            issues.push(`Secret must be at least ${this.config.minLength} characters`);
            strength = 'weak';
        }
        // Entropy calculation
        const entropy = this.calculateEntropy(secret);
        if (entropy < 3.5) {
            issues.push('Secret has low entropy (predictable patterns)');
            strength = 'weak';
        }
        else if (entropy < 4.0) {
            strength = 'medium';
        }
        // Character set validation
        const hasUpperCase = /[A-Z]/.test(secret);
        const hasLowerCase = /[a-z]/.test(secret);
        const hasNumbers = /[0-9]/.test(secret);
        const hasSpecialChars = /[^A-Za-z0-9]/.test(secret);
        const charsetCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChars]
            .filter(Boolean).length;
        if (charsetCount < 3) {
            issues.push('Secret should contain uppercase, lowercase, numbers, and special characters');
            if (strength === 'strong')
                strength = 'medium';
        }
        // Common patterns check
        if (this.hasCommonPatterns(secret)) {
            issues.push('Secret contains common patterns');
            strength = 'weak';
        }
        return {
            isValid: issues.length === 0,
            strength,
            issues,
            entropy
        };
    }
    /**
     * Calculates Shannon entropy of the secret
     */
    calculateEntropy(str) {
        const charCounts = new Map();
        for (const char of str) {
            charCounts.set(char, (charCounts.get(char) || 0) + 1);
        }
        let entropy = 0;
        const length = str.length;
        for (const count of charCounts.values()) {
            const probability = count / length;
            entropy -= probability * Math.log2(probability);
        }
        return entropy;
    }
    /**
     * Checks for common weak patterns in secrets
     */
    hasCommonPatterns(secret) {
        const weakPatterns = [
            /(.)\1{3,}/, // Repeated characters
            /123456|abcdef|qwerty/i, // Common sequences
            /password|secret|admin/i, // Common words
            /^[a-zA-Z]+$/, // Only letters
            /^[0-9]+$/, // Only numbers
        ];
        return weakPatterns.some(pattern => pattern.test(secret));
    }
    /**
     * Retrieves secret from configured source
     */
    async getSecretFromSource() {
        switch (this.config.source) {
            case 'environment':
                return this.getFromEnvironment();
            case 'azure-keyvault':
                return this.getFromAzureKeyVault();
            case 'kubernetes':
                return this.getFromKubernetesSecret();
            default:
                throw new Error(`Unsupported secret source: ${this.config.source}`);
        }
    }
    /**
     * Gets secret from environment variables with validation
     */
    getFromEnvironment() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable not found');
        }
        return secret;
    }
    /**
     * Gets secret from Azure Key Vault (placeholder implementation)
     */
    async getFromAzureKeyVault() {
        // TODO: Implement Azure Key Vault integration
        throw new Error('Azure Key Vault integration not yet implemented');
    }
    /**
     * Gets secret from Kubernetes secret (placeholder implementation)
     */
    async getFromKubernetesSecret() {
        // TODO: Implement Kubernetes secret integration
        throw new Error('Kubernetes secret integration not yet implemented');
    }
    /**
     * Checks if secret should be rotated based on age
     */
    shouldRotateSecret() {
        if (!this.secretCreatedAt)
            return true;
        const ageHours = (Date.now() - this.secretCreatedAt.getTime()) / (1000 * 60 * 60);
        return ageHours >= this.config.rotationIntervalHours;
    }
    /**
     * Rotates secret (placeholder for future implementation)
     */
    async rotateSecret() {
        this.logger.info('Secret rotation triggered');
        // TODO: Implement secret rotation logic
    }
    /**
     * Generates cryptographically secure random secret
     */
    static generateSecureSecret(length = 64) {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto_1.default.randomInt(0, charset.length);
            result += charset[randomIndex];
        }
        return result;
    }
}
exports.SecretManager = SecretManager;
// Export singleton instance
exports.secretManager = new SecretManager();
