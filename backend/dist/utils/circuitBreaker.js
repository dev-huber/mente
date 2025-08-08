"use strict";
/**
 * Circuit Breaker pattern implementation
 * Protege contra falhas em cascata e permite recuperação graciosa
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitState = void 0;
const logger_1 = require("./logger");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class CircuitBreaker {
    options;
    state = CircuitState.CLOSED;
    failureCount = 0;
    lastFailureTime;
    successCount = 0;
    nextAttempt;
    constructor(options) {
        this.options = options;
    }
    async execute(operation) {
        if (this.state === CircuitState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.transitionTo(CircuitState.HALF_OPEN);
            }
            else {
                throw new Error(`Circuit breaker is OPEN. Next attempt at ${this.nextAttempt}`);
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failureCount = 0;
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
            if (this.successCount >= 3) {
                this.transitionTo(CircuitState.CLOSED);
            }
        }
    }
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = new Date();
        if (this.state === CircuitState.HALF_OPEN) {
            this.transitionTo(CircuitState.OPEN);
        }
        else if (this.failureCount >= this.options.failureThreshold) {
            this.transitionTo(CircuitState.OPEN);
        }
    }
    shouldAttemptReset() {
        if (!this.nextAttempt)
            return false;
        return new Date() >= this.nextAttempt;
    }
    transitionTo(newState) {
        const oldState = this.state;
        this.state = newState;
        if (newState === CircuitState.OPEN) {
            this.nextAttempt = new Date(Date.now() + this.options.resetTimeout);
            this.successCount = 0;
        }
        logger_1.logger.info(`Circuit breaker state change: ${oldState} -> ${newState}`, {
            operation: 'transitionTo',
            service: 'CircuitBreaker',
            metadata: {
                oldState,
                newState,
                failureCount: this.failureCount,
                nextAttempt: this.nextAttempt,
            },
        });
        this.options.onStateChange?.(oldState, newState);
    }
    isOpen() {
        return this.state === CircuitState.OPEN && !this.shouldAttemptReset();
    }
    getState() {
        return this.state;
    }
}
exports.CircuitBreaker = CircuitBreaker;
