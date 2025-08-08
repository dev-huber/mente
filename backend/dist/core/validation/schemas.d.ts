/**
 * Schemas de validação com Zod
 * Implementa defense in depth com validação rigorosa
 */
import { z } from 'zod';
export declare const audioUploadSchema: z.ZodObject<{
    audio: z.ZodObject<{
        mimetype: z.ZodEnum<["audio/wav", "audio/mp3", "audio/mpeg", "audio/m4a"]>;
        size: z.ZodNumber;
        buffer: z.ZodType<Buffer<ArrayBufferLike>, z.ZodTypeDef, Buffer<ArrayBufferLike>>;
        originalname: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        size: number;
        mimetype: "audio/mpeg" | "audio/wav" | "audio/mp3" | "audio/m4a";
        buffer: Buffer<ArrayBufferLike>;
        originalname: string;
    }, {
        size: number;
        mimetype: "audio/mpeg" | "audio/wav" | "audio/mp3" | "audio/m4a";
        buffer: Buffer<ArrayBufferLike>;
        originalname: string;
    }>;
    metadata: z.ZodObject<{
        duration: z.ZodNumber;
        language: z.ZodDefault<z.ZodEnum<["pt", "en", "es"]>>;
        isPublic: z.ZodDefault<z.ZodBoolean>;
        userId: z.ZodString;
        sessionId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        userId: string;
        duration: number;
        language: "pt" | "en" | "es";
        isPublic: boolean;
        sessionId?: string | undefined;
    }, {
        userId: string;
        duration: number;
        language?: "pt" | "en" | "es" | undefined;
        isPublic?: boolean | undefined;
        sessionId?: string | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    metadata: {
        userId: string;
        duration: number;
        language: "pt" | "en" | "es";
        isPublic: boolean;
        sessionId?: string | undefined;
    };
    audio: {
        size: number;
        mimetype: "audio/mpeg" | "audio/wav" | "audio/mp3" | "audio/m4a";
        buffer: Buffer<ArrayBufferLike>;
        originalname: string;
    };
}, {
    metadata: {
        userId: string;
        duration: number;
        language?: "pt" | "en" | "es" | undefined;
        isPublic?: boolean | undefined;
        sessionId?: string | undefined;
    };
    audio: {
        size: number;
        mimetype: "audio/mpeg" | "audio/wav" | "audio/mp3" | "audio/m4a";
        buffer: Buffer<ArrayBufferLike>;
        originalname: string;
    };
}>;
export declare const analysisResultSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    timestamp: z.ZodDate;
    audio: z.ZodObject<{
        url: z.ZodString;
        duration: z.ZodNumber;
        format: z.ZodString;
        sampleRate: z.ZodNumber;
        bitRate: z.ZodNumber;
        size: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        duration: number;
        format: string;
        sampleRate: number;
        size: number;
        url: string;
        bitRate: number;
    }, {
        duration: number;
        format: string;
        sampleRate: number;
        size: number;
        url: string;
        bitRate: number;
    }>;
    transcription: z.ZodObject<{
        text: z.ZodString;
        language: z.ZodString;
        confidence: z.ZodNumber;
        words: z.ZodArray<z.ZodObject<{
            text: z.ZodString;
            start: z.ZodNumber;
            end: z.ZodNumber;
            confidence: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            end: number;
            text: string;
            confidence: number;
            start: number;
        }, {
            end: number;
            text: string;
            confidence: number;
            start: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        language: string;
        text: string;
        confidence: number;
        words: {
            end: number;
            text: string;
            confidence: number;
            start: number;
        }[];
    }, {
        language: string;
        text: string;
        confidence: number;
        words: {
            end: number;
            text: string;
            confidence: number;
            start: number;
        }[];
    }>;
    analysis: z.ZodObject<{
        lieScore: z.ZodNumber;
        confidence: z.ZodNumber;
        linguistic: z.ZodObject<{
            complexity: z.ZodNumber;
            hesitations: z.ZodNumber;
            fillerWords: z.ZodArray<z.ZodString, "many">;
            contradictions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            complexity: number;
            hesitations: number;
            fillerWords: string[];
            contradictions: string[];
        }, {
            complexity: number;
            hesitations: number;
            fillerWords: string[];
            contradictions: string[];
        }>;
        sentiment: z.ZodObject<{
            overall: z.ZodEnum<["positive", "negative", "neutral", "mixed"]>;
            scores: z.ZodObject<{
                positive: z.ZodNumber;
                negative: z.ZodNumber;
                neutral: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                positive: number;
                negative: number;
                neutral: number;
            }, {
                positive: number;
                negative: number;
                neutral: number;
            }>;
        }, "strip", z.ZodTypeAny, {
            overall: "positive" | "negative" | "neutral" | "mixed";
            scores: {
                positive: number;
                negative: number;
                neutral: number;
            };
        }, {
            overall: "positive" | "negative" | "neutral" | "mixed";
            scores: {
                positive: number;
                negative: number;
                neutral: number;
            };
        }>;
        verdict: z.ZodObject<{
            classification: z.ZodEnum<["truth", "lie", "uncertain"]>;
            explanation: z.ZodString;
            keyIndicators: z.ZodArray<z.ZodString, "many">;
            suggestions: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            classification: "truth" | "lie" | "uncertain";
            explanation: string;
            keyIndicators: string[];
            suggestions: string[];
        }, {
            classification: "truth" | "lie" | "uncertain";
            explanation: string;
            keyIndicators: string[];
            suggestions: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        lieScore: number;
        linguistic: {
            complexity: number;
            hesitations: number;
            fillerWords: string[];
            contradictions: string[];
        };
        sentiment: {
            overall: "positive" | "negative" | "neutral" | "mixed";
            scores: {
                positive: number;
                negative: number;
                neutral: number;
            };
        };
        verdict: {
            classification: "truth" | "lie" | "uncertain";
            explanation: string;
            keyIndicators: string[];
            suggestions: string[];
        };
    }, {
        confidence: number;
        lieScore: number;
        linguistic: {
            complexity: number;
            hesitations: number;
            fillerWords: string[];
            contradictions: string[];
        };
        sentiment: {
            overall: "positive" | "negative" | "neutral" | "mixed";
            scores: {
                positive: number;
                negative: number;
                neutral: number;
            };
        };
        verdict: {
            classification: "truth" | "lie" | "uncertain";
            explanation: string;
            keyIndicators: string[];
            suggestions: string[];
        };
    }>;
    metadata: z.ZodObject<{
        processingTime: z.ZodNumber;
        aiModel: z.ZodString;
        modelVersion: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        processingTime: number;
        aiModel: string;
        modelVersion: string;
    }, {
        processingTime: number;
        aiModel: string;
        modelVersion: string;
    }>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    metadata: {
        processingTime: number;
        aiModel: string;
        modelVersion: string;
    };
    timestamp: Date;
    audio: {
        duration: number;
        format: string;
        sampleRate: number;
        size: number;
        url: string;
        bitRate: number;
    };
    id: string;
    transcription: {
        language: string;
        text: string;
        confidence: number;
        words: {
            end: number;
            text: string;
            confidence: number;
            start: number;
        }[];
    };
    analysis: {
        confidence: number;
        lieScore: number;
        linguistic: {
            complexity: number;
            hesitations: number;
            fillerWords: string[];
            contradictions: string[];
        };
        sentiment: {
            overall: "positive" | "negative" | "neutral" | "mixed";
            scores: {
                positive: number;
                negative: number;
                neutral: number;
            };
        };
        verdict: {
            classification: "truth" | "lie" | "uncertain";
            explanation: string;
            keyIndicators: string[];
            suggestions: string[];
        };
    };
}, {
    userId: string;
    metadata: {
        processingTime: number;
        aiModel: string;
        modelVersion: string;
    };
    timestamp: Date;
    audio: {
        duration: number;
        format: string;
        sampleRate: number;
        size: number;
        url: string;
        bitRate: number;
    };
    id: string;
    transcription: {
        language: string;
        text: string;
        confidence: number;
        words: {
            end: number;
            text: string;
            confidence: number;
            start: number;
        }[];
    };
    analysis: {
        confidence: number;
        lieScore: number;
        linguistic: {
            complexity: number;
            hesitations: number;
            fillerWords: string[];
            contradictions: string[];
        };
        sentiment: {
            overall: "positive" | "negative" | "neutral" | "mixed";
            scores: {
                positive: number;
                negative: number;
                neutral: number;
            };
        };
        verdict: {
            classification: "truth" | "lie" | "uncertain";
            explanation: string;
            keyIndicators: string[];
            suggestions: string[];
        };
    };
}>;
export declare const authSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    email: string;
}, {
    password: string;
    email: string;
}>;
export declare const rateLimitSchema: z.ZodObject<{
    userId: z.ZodString;
    endpoint: z.ZodString;
    timestamp: z.ZodDate;
    count: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    userId: string;
    timestamp: Date;
    endpoint: string;
    count: number;
}, {
    userId: string;
    timestamp: Date;
    endpoint: string;
    count: number;
}>;
export type AudioUploadInput = z.infer<typeof audioUploadSchema>;
export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type AuthInput = z.infer<typeof authSchema>;
export type RateLimitEntry = z.infer<typeof rateLimitSchema>;
//# sourceMappingURL=schemas.d.ts.map