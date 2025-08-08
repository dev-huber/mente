"use strict";
/**
 * Azure Function - Upload de Áudio para "Quem Mente Menos?"
 * Endpoint principal com validação defensiva completa
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.audioUpload = audioUpload;
exports.healthCheck = healthCheck;
const functions_1 = require("@azure/functions");
const audioProcessingService_1 = require("@/services/audioProcessingService");
const lieDetectionService_1 = require("@/services/lieDetectionService");
const logger_1 = require("@/utils/logger");
const CustomErrors_1 = require("@/core/errors/CustomErrors");
const multer_1 = __importDefault(require("multer"));
const uuid_1 = require("uuid");
// Configuração do multer com validação defensiva
const upload = (0, multer_1.default)({
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
        files: 1,
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new CustomErrors_1.ValidationError(`Formato não suportado: ${file.mimetype}`));
        }
    },
    storage: multer_1.default.memoryStorage(),
});
async function audioUpload(request, context) {
    const requestId = (0, uuid_1.v4)();
    const timer = logger_1.logger.startTimer();
    // Configurar contexto de logging
    logger_1.logger.setDefaultContext({
        requestId,
        operation: 'audioUpload',
        service: 'AudioUploadFunction',
    });
    try {
        // Log da requisição
        logger_1.logger.info('Requisição de upload recebida', {
            metadata: {
                method: request.method,
                url: request.url,
                headers: request.headers,
            },
        });
        // Validar método HTTP
        if (request.method !== 'POST') {
            return {
                status: 405,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Method not allowed',
                    requestId,
                }),
            };
        }
        // Extrair e validar token de autenticação
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logger_1.logger.warn('Tentativa de acesso sem autenticação');
            return {
                status: 401,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: 'Authentication required',
                    requestId,
                }),
            };
        }
        // TODO: Validar JWT token
        const userId = 'mock-user-id'; // Substituir por validação real
        // Verificar rate limiting
        const isRateLimited = await checkRateLimit(userId);
        if (isRateLimited) {
            throw new CustomErrors_1.RateLimitError('Muitas requisições. Tente novamente em alguns minutos.', 60, { userId, requestId });
        }
        // Processar upload do áudio
        const formData = await request.formData();
        const audioFile = formData.get('audio');
        if (!audioFile) {
            throw new CustomErrors_1.ValidationError('Arquivo de áudio não encontrado', {
                requestId,
                operation: 'audioUpload',
            });
        }
        // Converter File para Buffer
        const buffer = Buffer.from(await audioFile.arrayBuffer());
        // Preparar dados para processamento
        const audioInput = {
            audio: {
                mimetype: audioFile.type,
                size: audioFile.size,
                buffer,
                originalname: audioFile.name,
            },
            metadata: {
                duration: Number(formData.get('duration') || 0),
                language: formData.get('language') || 'pt',
                isPublic: formData.get('isPublic') === 'true',
                userId,
                sessionId: requestId,
            },
        };
        // Processar áudio (upload para storage)
        const processedAudio = await audioProcessingService_1.audioProcessingService.processAudio(audioInput);
        // TODO: Implementar análise completa com AI
        // Por enquanto, retornar mock de análise
        const mockAnalysis = {
            transcription: {
                text: 'Mock transcription for testing',
                words: [],
                language: 'pt',
            },
            vocalAnalysis: {
                pitchMean: 150,
                pitchStd: 30,
                energyMean: 50,
                energyStd: 20,
                speakingRate: 150,
                pauseRatio: 0.2,
            },
            sentiment: {
                positive: 0.3,
                negative: 0.2,
                neutral: 0.5,
                intensity: 0.5,
            },
        };
        // Detectar mentira
        const lieDetectionResult = await lieDetectionService_1.lieDetectionService.detectLie(mockAnalysis);
        // Preparar resposta
        const response = {
            success: true,
            requestId,
            data: {
                audioId: processedAudio.id,
                audioUrl: processedAudio.url,
                analysis: lieDetectionResult,
                processedAt: new Date().toISOString(),
            },
        };
        // Métricas
        const duration = timer();
        logger_1.logger.info('Upload e análise concluídos com sucesso', {
            duration,
            metadata: {
                audioId: processedAudio.id,
                lieScore: lieDetectionResult.lieScore,
                classification: lieDetectionResult.classification,
            },
        });
        logger_1.logger.metric('audio_upload_duration', duration);
        logger_1.logger.metric('audio_upload_size', audioFile.size);
        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Request-Id': requestId,
            },
            body: JSON.stringify(response),
        };
    }
    catch (error) {
        const duration = timer();
        // Log de erro
        logger_1.logger.error('Falha no upload de áudio', error, {
            duration,
            metadata: { requestId },
        });
        // Tratamento específico de erros
        if (error instanceof CustomErrors_1.ValidationError) {
            return {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    error: error.message,
                    code: error.code,
                    requestId,
                }),
            };
        }
        if (error instanceof CustomErrors_1.RateLimitError) {
            return {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': error.retryAfter.toString(),
                },
                body: JSON.stringify({
                    error: error.message,
                    retryAfter: error.retryAfter,
                    requestId,
                }),
            };
        }
        // Erro genérico (não expor detalhes internos)
        return {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                error: 'Erro interno no processamento',
                requestId,
            }),
        };
    }
}
// Função auxiliar para rate limiting
async function checkRateLimit(userId) {
    // TODO: Implementar rate limiting real com Redis
    // Por enquanto, sempre permite
    return false;
}
// Registrar função no Azure Functions
functions_1.app.http('audioUpload', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: audioUpload,
});
// Health check endpoint
async function healthCheck(request, context) {
    return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            status: 'healthy',
            service: 'quem-mente-menos-api',
            version: process.env.APP_VERSION || '1.0.0',
            timestamp: new Date().toISOString(),
        }),
    };
}
functions_1.app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: healthCheck,
});
