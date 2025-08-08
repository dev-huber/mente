/**
 * Servidor de desenvolvimento simples para testes
 */
import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 7071;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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
    
    logger.info('Health check requested', { status: 'healthy' });
    res.json(healthStatus);
});

// Audio upload endpoint (mock)
app.post('/api/audioUpload', (req, res) => {
    logger.info('Audio upload requested', {
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
app.use((error: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Server error', error, {
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
            logger.info('Simple development server started', {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                endpoints: ['/api/health', '/api/audioUpload']
            });
            console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error('Failed to start server', error as Error, { port: PORT });
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();