"use strict";
/**
 * Retry Policy com exponential backoff
 * Implementa retry inteligente para operações falíveis
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryPolicy = void 0;
const logger_1 = require("./logger");
class RetryPolicy {
    options;
    constructor(options) {
        this.options = options;
    }
    async execute(operation) {
        let lastError;
        let delay = this.options.initialDelay;
        for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === this.options.maxRetries) {
                    break;
                }
                if (this.options.shouldRetry && !this.options.shouldRetry(error)) {
                    throw error;
                }
                logger_1.logger.warn(`Retry attempt ${attempt + 1}/${this.options.maxRetries}`, {
                    operation: 'execute',
                    service: 'RetryPolicy',
                    metadata: {
                        attempt: attempt + 1,
                        delay,
                        error: error instanceof Error ? error.message : String(error),
                    },
                });
                await this.sleep(delay);
                delay = Math.min(delay * this.options.factor, this.options.maxDelay);
            }
        }
        logger_1.logger.error('All retry attempts failed', lastError, {
            operation: 'execute',
            service: 'RetryPolicy',
            metadata: { maxRetries: this.options.maxRetries },
        });
        throw lastError;
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.RetryPolicy = RetryPolicy;
