/**
 * Schemas de validação com Zod
 * Implementa defense in depth com validação rigorosa
 */

import { z } from 'zod';

// Constantes de validação
const AUDIO_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const AUDIO_MIN_DURATION = 1; // 1 segundo
const AUDIO_MAX_DURATION = 300; // 5 minutos
const SUPPORTED_AUDIO_FORMATS = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a'] as const;

// Schema para upload de áudio
export const audioUploadSchema = z.object({
  audio: z.object({
    mimetype: z.enum(SUPPORTED_AUDIO_FORMATS, {
      errorMap: () => ({ message: `Formato não suportado. Use: ${SUPPORTED_AUDIO_FORMATS.join(', ')}` })
    }),
    size: z.number()
      .min(1, 'Arquivo vazio')
      .max(AUDIO_MAX_SIZE, `Arquivo muito grande. Máximo: ${AUDIO_MAX_SIZE / 1024 / 1024}MB`),
    buffer: z.instanceof(Buffer),
    originalname: z.string().min(1).max(255),
  }),
  metadata: z.object({
    duration: z.number()
      .min(AUDIO_MIN_DURATION, `Áudio muito curto. Mínimo: ${AUDIO_MIN_DURATION}s`)
      .max(AUDIO_MAX_DURATION, `Áudio muito longo. Máximo: ${AUDIO_MAX_DURATION}s`),
    language: z.enum(['pt', 'en', 'es'], {
      errorMap: () => ({ message: 'Idioma não suportado' })
    }).default('pt'),
    isPublic: z.boolean().default(false),
    userId: z.string().uuid('ID de usuário inválido'),
    sessionId: z.string().uuid('ID de sessão inválido').optional(),
  }),
});

// Schema para resultado de análise
export const analysisResultSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  timestamp: z.date(),
  
  audio: z.object({
    url: z.string().url(),
    duration: z.number().positive(),
    format: z.string(),
    sampleRate: z.number().positive(),
    bitRate: z.number().positive(),
    size: z.number().positive(),
  }),
  
  transcription: z.object({
    text: z.string().min(1),
    language: z.string().length(2),
    confidence: z.number().min(0).max(100),
    words: z.array(z.object({
      text: z.string(),
      start: z.number(),
      end: z.number(),
      confidence: z.number(),
    })),
  }),
  
  analysis: z.object({
    lieScore: z.number().min(0).max(100),
    confidence: z.number().min(0).max(100),
    
    linguistic: z.object({
      complexity: z.number(),
      hesitations: z.number().int().nonnegative(),
      fillerWords: z.array(z.string()),
      contradictions: z.array(z.string()),
    }),
    
    sentiment: z.object({
      overall: z.enum(['positive', 'negative', 'neutral', 'mixed']),
      scores: z.object({
        positive: z.number().min(0).max(1),
        negative: z.number().min(0).max(1),
        neutral: z.number().min(0).max(1),
      }),
    }),
    
    verdict: z.object({
      classification: z.enum(['truth', 'lie', 'uncertain']),
      explanation: z.string(),
      keyIndicators: z.array(z.string()),
      suggestions: z.array(z.string()),
    }),
  }),
  
  metadata: z.object({
    processingTime: z.number().positive(),
    aiModel: z.string(),
    modelVersion: z.string(),
  }),
});

// Schema para autenticação
export const authSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim()
    .max(255),
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(128, 'Senha muito longa')
    .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter caractere especial'),
});

// Schema para rate limiting
export const rateLimitSchema = z.object({
  userId: z.string().uuid(),
  endpoint: z.string(),
  timestamp: z.date(),
  count: z.number().int().positive(),
});

// Type exports
export type AudioUploadInput = z.infer<typeof audioUploadSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AuthInput = z.infer<typeof authSchema>;
export type RateLimitEntry = z.infer<typeof rateLimitSchema>;
