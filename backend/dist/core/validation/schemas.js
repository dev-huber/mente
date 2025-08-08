"use strict";
/**
 * Schemas de validação com Zod
 * Implementa defense in depth com validação rigorosa
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimitSchema = exports.authSchema = exports.analysisResultSchema = exports.audioUploadSchema = void 0;
const zod_1 = require("zod");
// Constantes de validação
const AUDIO_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const AUDIO_MIN_DURATION = 1; // 1 segundo
const AUDIO_MAX_DURATION = 300; // 5 minutos
const SUPPORTED_AUDIO_FORMATS = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a'];
// Schema para upload de áudio
exports.audioUploadSchema = zod_1.z.object({
    audio: zod_1.z.object({
        mimetype: zod_1.z.enum(SUPPORTED_AUDIO_FORMATS, {
            errorMap: () => ({ message: `Formato não suportado. Use: ${SUPPORTED_AUDIO_FORMATS.join(', ')}` })
        }),
        size: zod_1.z.number()
            .min(1, 'Arquivo vazio')
            .max(AUDIO_MAX_SIZE, `Arquivo muito grande. Máximo: ${AUDIO_MAX_SIZE / 1024 / 1024}MB`),
        buffer: zod_1.z.instanceof(Buffer),
        originalname: zod_1.z.string().min(1).max(255),
    }),
    metadata: zod_1.z.object({
        duration: zod_1.z.number()
            .min(AUDIO_MIN_DURATION, `Áudio muito curto. Mínimo: ${AUDIO_MIN_DURATION}s`)
            .max(AUDIO_MAX_DURATION, `Áudio muito longo. Máximo: ${AUDIO_MAX_DURATION}s`),
        language: zod_1.z.enum(['pt', 'en', 'es'], {
            errorMap: () => ({ message: 'Idioma não suportado' })
        }).default('pt'),
        isPublic: zod_1.z.boolean().default(false),
        userId: zod_1.z.string().uuid('ID de usuário inválido'),
        sessionId: zod_1.z.string().uuid('ID de sessão inválido').optional(),
    }),
});
// Schema para resultado de análise
exports.analysisResultSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    userId: zod_1.z.string().uuid(),
    timestamp: zod_1.z.date(),
    audio: zod_1.z.object({
        url: zod_1.z.string().url(),
        duration: zod_1.z.number().positive(),
        format: zod_1.z.string(),
        sampleRate: zod_1.z.number().positive(),
        bitRate: zod_1.z.number().positive(),
        size: zod_1.z.number().positive(),
    }),
    transcription: zod_1.z.object({
        text: zod_1.z.string().min(1),
        language: zod_1.z.string().length(2),
        confidence: zod_1.z.number().min(0).max(100),
        words: zod_1.z.array(zod_1.z.object({
            text: zod_1.z.string(),
            start: zod_1.z.number(),
            end: zod_1.z.number(),
            confidence: zod_1.z.number(),
        })),
    }),
    analysis: zod_1.z.object({
        lieScore: zod_1.z.number().min(0).max(100),
        confidence: zod_1.z.number().min(0).max(100),
        linguistic: zod_1.z.object({
            complexity: zod_1.z.number(),
            hesitations: zod_1.z.number().int().nonnegative(),
            fillerWords: zod_1.z.array(zod_1.z.string()),
            contradictions: zod_1.z.array(zod_1.z.string()),
        }),
        sentiment: zod_1.z.object({
            overall: zod_1.z.enum(['positive', 'negative', 'neutral', 'mixed']),
            scores: zod_1.z.object({
                positive: zod_1.z.number().min(0).max(1),
                negative: zod_1.z.number().min(0).max(1),
                neutral: zod_1.z.number().min(0).max(1),
            }),
        }),
        verdict: zod_1.z.object({
            classification: zod_1.z.enum(['truth', 'lie', 'uncertain']),
            explanation: zod_1.z.string(),
            keyIndicators: zod_1.z.array(zod_1.z.string()),
            suggestions: zod_1.z.array(zod_1.z.string()),
        }),
    }),
    metadata: zod_1.z.object({
        processingTime: zod_1.z.number().positive(),
        aiModel: zod_1.z.string(),
        modelVersion: zod_1.z.string(),
    }),
});
// Schema para autenticação
exports.authSchema = zod_1.z.object({
    email: zod_1.z.string()
        .email('Email inválido')
        .toLowerCase()
        .trim()
        .max(255),
    password: zod_1.z.string()
        .min(8, 'Senha deve ter no mínimo 8 caracteres')
        .max(128, 'Senha muito longa')
        .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
        .regex(/[a-z]/, 'Senha deve conter letra minúscula')
        .regex(/[0-9]/, 'Senha deve conter número')
        .regex(/[^A-Za-z0-9]/, 'Senha deve conter caractere especial'),
});
// Schema para rate limiting
exports.rateLimitSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    endpoint: zod_1.z.string(),
    timestamp: zod_1.z.date(),
    count: zod_1.z.number().int().positive(),
});
