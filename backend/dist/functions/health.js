"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = healthCheck;
const logger_1 = require("../utils/logger");
const functions_1 = require("@azure/functions");
const uuid_1 = require("uuid");
// Track function start time for uptime calculation
const functionStartTime = Date.now();
async function performHealthChecks(requestId) {
    const results = {
        storage: false,
        aiServices: false,
        memory: false,
        uptime: Date.now() - functionStartTime
    };
    try {
        // Check Azure Blob Storage
        const storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        results.storage = !!storageConnectionString && storageConnectionString.includes('AccountName');
        // Check Azure AI Services configuration
        const aiSubscriptionKey = process.env.AZURE_AI_SUBSCRIPTION_KEY;
        const speechKey = process.env.AZURE_SPEECH_KEY;
        const textAnalyticsKey = process.env.AZURE_TEXT_ANALYTICS_KEY;
        results.aiServices = !!(aiSubscriptionKey || speechKey || textAnalyticsKey);
        // Check memory usage
        const memoryUsage = process.memoryUsage();
        const memoryLimitMB = 512; // Azure Functions basic memory limit
        const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
        results.memory = usedMemoryMB < (memoryLimitMB * 0.8); // Alert at 80%
        logger_1.logger.info('Health checks completed', {
            requestId,
            results,
            memoryUsageMB: usedMemoryMB,
            uptime: results.uptime
        });
    }
    catch (error) {
        logger_1.logger.error('Health check failed', error, { requestId });
    }
    return results;
}
function determineOverallHealth(checks) {
    if (!checks.storage || !checks.memory) {
        return 'unhealthy';
    }
    if (!checks.aiServices) {
        return 'degraded'; // Can work with mock data
    }
    return 'healthy';
}
async function healthCheck(request) {
    const requestId = (0, uuid_1.v4)();
    const startTime = Date.now();
    try {
        logger_1.logger.info('Health check started', { requestId, method: request.method });
        // Validate method
        if (request.method !== 'GET') {
            return {
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    'Allow': 'GET'
                },
                body: JSON.stringify({
                    error: 'Method not allowed',
                    message: 'Health check only supports GET requests',
                    requestId
                })
            };
        }
        // Perform health checks
        const checks = await performHealthChecks(requestId);
        const overallStatus = determineOverallHealth(checks);
        const healthStatus = {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            requestId,
            uptime: checks.uptime,
            checks: {
                function: 'ok',
                storage: checks.storage ? 'healthy' : 'unhealthy',
                ai_services: checks.aiServices ? 'healthy' : 'degraded',
                memory: checks.memory ? 'healthy' : 'warning'
            },
            details: {
                memoryUsageMB: process.memoryUsage().heapUsed / 1024 / 1024,
                memoryLimitMB: 512,
                configuredServices: [
                    process.env.AZURE_STORAGE_CONNECTION_STRING ? 'Storage' : null,
                    process.env.AZURE_AI_SUBSCRIPTION_KEY ? 'AI Services' : null,
                    process.env.AZURE_SPEECH_KEY ? 'Speech' : null,
                    process.env.AZURE_TEXT_ANALYTICS_KEY ? 'Text Analytics' : null,
                ].filter(Boolean)
            }
        };
        const duration = Date.now() - startTime;
        logger_1.logger.info('Health check completed', {
            requestId,
            status: overallStatus,
            duration,
            configuredServices: healthStatus.details?.configuredServices
        });
        // Return appropriate HTTP status based on health
        const httpStatus = overallStatus === 'healthy' ? 200 :
            overallStatus === 'degraded' ? 200 : 503;
        return {
            status: httpStatus,
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            body: JSON.stringify(healthStatus, null, 2)
        };
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.logger.error('Health check failed', error, { requestId, duration });
        return {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                requestId,
                error: 'Health check failed',
                message: error instanceof Error ? error.message : 'Unknown error'
            })
        };
    }
}
// Register the health check function
functions_1.app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: healthCheck
});
