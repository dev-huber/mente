"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Servidor de desenvolvimento simples para testes
 */
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 7071;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
// Health check endpoint
app.get('/api/health', (_req, res) => {
    const healthStatus = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'mentira-app-backend',
        version: '1.0.0',
        checks: {
            server: 'ok',
            memory: 'ok',
            uptime: process.uptime()
        }
    };
    logger_1.logger.info('Health check requested', { status: 'healthy' });
    res.json(healthStatus);
});
// Audio upload endpoint (mock)
app.post('/api/audioUpload', (req, res) => {
    logger_1.logger.info('Audio upload requested', {
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length']
    });
    // Mock response for testing
    res.json({
        success: true,
        requestId: `req_${Date.now()}`,
        status: 'processed',
        timestamp: new Date().toISOString(),
        analysis: {
            transcription: 'Análise de áudio simulada para desenvolvimento',
            confidence: 0.95,
            truthfulness: 0.85,
            riskLevel: 'low'
        }
    });
});
// Root endpoint
app.get('/', (_req, res) => {
    res.json({
        message: 'Quem Mente Menos - Backend Development Server',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            audioUpload: '/api/audioUpload',
            docs: 'Ver README.md para documentação da API'
        }
    });
});
// Error handling middleware
app.use((error, req, res, _next) => {
    logger_1.logger.error('Server error', error, {
        url: req.url,
        method: req.method
    });
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: `error_${Date.now()}`
    });
});
// Start server
async function startServer() {
    try {
        app.listen(PORT, () => {
            logger_1.logger.info('Simple development server started', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                endpoints: ['/api/health', '/api/audioUpload']
            });
            console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', error, { port: PORT });
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger_1.logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
startServer();
