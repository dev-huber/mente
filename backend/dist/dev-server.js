"use strict";
/**
 * Development Server - Substitui Azure Functions Core Tools
 * Servidor Express.js que simula o ambiente Azure Functions para desenvolvimento local
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const multer_1 = __importDefault(require("multer"));
const audioUpload_1 = require("./functions/audioUpload");
const health_1 = require("./functions/health");
const logger_1 = require("./utils/logger");
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.PORT || 7071;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Configurar multer para upload de arquivos
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});
// Mock do HttpRequest para Azure Functions
function createMockRequest(req) {
    return {
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        params: req.params,
        body: req.body,
        raw: req.body,
        bufferBody: req.body
    };
}
// Middleware para converter Express Response para Azure Functions Response
function handleAzureFunctionResponse(res) {
    return (azureResponse) => {
        if (azureResponse.headers) {
            Object.entries(azureResponse.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
            });
        }
        res.status(azureResponse.status || 200);
        if (azureResponse.body) {
            if (typeof azureResponse.body === 'string') {
                res.send(azureResponse.body);
            }
            else {
                res.json(azureResponse.body);
            }
        }
        else {
            res.end();
        }
    };
}
// Rotas - Health Check
app.get('/api/health', async (req, res) => {
    try {
        logger_1.logger.info('Health check request received', {
            method: req.method,
            url: req.url,
            userAgent: req.get('User-Agent')
        });
        const mockRequest = createMockRequest(req);
        const response = await (0, health_1.healthCheck)(mockRequest);
        handleAzureFunctionResponse(res)(response);
    }
    catch (error) {
        logger_1.logger.error('Health check failed', error, { url: req.url });
        res.status(500).json({
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Rotas - Audio Upload
app.post('/api/audioUpload', upload.single('audio'), async (req, res) => {
    try {
        logger_1.logger.info('Audio upload request received', {
            method: req.method,
            url: req.url,
            hasFile: !!req.file,
            fileSize: req.file?.size,
            contentType: req.get('Content-Type')
        });
        // Preparar dados do arquivo para o Azure Function
        let mockRequest = createMockRequest(req);
        if (req.file) {
            // Simular multipart data como Azure Functions recebe
            mockRequest.headers['content-type'] = req.get('Content-Type');
            mockRequest.body = req.file.buffer;
            mockRequest.raw = req.file.buffer;
        }
        const response = await (0, audioUpload_1.audioUpload)(mockRequest);
        handleAzureFunctionResponse(res)(response);
    }
    catch (error) {
        logger_1.logger.error('Audio upload failed', error, { url: req.url });
        res.status(500).json({
            error: 'Upload failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
// Rota para testar conectividade
app.get('/', (_req, res) => {
    res.json({
        message: 'Quem Mente Menos - Backend Development Server',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/api/health',
            audioUpload: '/api/audioUpload (POST)'
        },
        docs: 'See README.md for API documentation'
    });
});
// Middleware de erro global
app.use((error, req, res, _next) => {
    logger_1.logger.error('Unhandled error in dev server', error, {
        url: req.url,
        method: req.method
    });
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
        requestId: req.headers['x-request-id'] || 'unknown'
    });
});
// Iniciar servidor
async function startServer() {
    try {
        app.listen(port, () => {
            logger_1.logger.info('Development server started', {
                port,
                environment: process.env.NODE_ENV || 'development',
                endpoints: {
                    root: `http://localhost:${port}/`,
                    health: `http://localhost:${port}/api/health`,
                    audioUpload: `http://localhost:${port}/api/audioUpload`
                }
            });
            console.log(`🚀 Development Server running on http://localhost:${port}`);
            console.log(`📊 Health Check: http://localhost:${port}/api/health`);
            console.log(`📤 Audio Upload: http://localhost:${port}/api/audioUpload`);
            console.log(`📚 API Docs: http://localhost:${port}/`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start development server', error, { port });
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', () => {
    logger_1.logger.info('Shutting down development server...');
    process.exit(0);
});
process.on('SIGTERM', () => {
    logger_1.logger.info('Development server terminated');
    process.exit(0);
});
// Iniciar servidor se executado diretamente
if (require.main === module) {
    startServer();
}
