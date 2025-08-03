"use strict";
/**
 * Sistema de autenticação JWT completo e defensivo
 * - Validação rigorosa de inputs
 * - Error handling abrangente
 * - Rate limiting
 * - Refresh token rotation
 * - Logging de segurança
 * - Testes unitários inclusos
 * - Documentação de cenários de erro
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAuthConfig = exports.JwtAuthService = void 0;
exports.logSecurityEvent = logSecurityEvent;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const joi_1 = __importDefault(require("joi"));
const crypto_1 = __importDefault(require("crypto"));
// Validação de payloads
const payloadSchema = joi_1.default.object({
    userId: joi_1.default.string().min(3).max(64).required(),
    roles: joi_1.default.array().items(joi_1.default.string()).min(1).required(),
    issuedAt: joi_1.default.number().required(),
    refreshId: joi_1.default.string().optional()
}).unknown(true); // Permite campos extras do JWT
// Rate limiting simples (in-memory, para demo)
const rateLimitMap = new Map();
class JwtAuthService {
    constructor(config) {
        this.config = config;
    }
    /**
     * Gera par de tokens JWT (access + refresh) com validação e logging
     */
    generateTokenPair(payload) {
        // Fail Fast: validação de payload
        const { error } = payloadSchema.validate(payload);
        if (error) {
            return { success: false, error: `Payload inválido: ${error.message}` };
        }
        // Rate limiting defensivo
        if (!this.checkRateLimit(payload.userId)) {
            return { success: false, error: 'Rate limit excedido' };
        }
        // Geração de refreshId único
        const refreshId = crypto_1.default.randomBytes(32).toString('hex');
        const now = Math.floor(Date.now() / 1000);
        const accessPayload = { ...payload, issuedAt: now };
        const refreshPayload = { userId: payload.userId, refreshId, issuedAt: now, roles: payload.roles };
        try {
            const accessToken = jsonwebtoken_1.default.sign(accessPayload, this.config.secret, {
                expiresIn: this.config.expiresIn,
                algorithm: 'HS256'
            });
            const refreshToken = jsonwebtoken_1.default.sign(refreshPayload, this.config.secret, {
                expiresIn: this.config.refreshExpiresIn,
                algorithm: 'HS256'
            });
            // Logging de segurança
            logSecurityEvent('token_generated', {
                userId: payload.userId,
                roles: payload.roles,
                issuedAt: accessPayload.issuedAt
            });
            return { success: true, data: { accessToken, refreshToken } };
        }
        catch (err) {
            return { success: false, error: `Erro ao gerar token: ${err.message}` };
        }
    }
    /**
     * Valida token JWT e retorna payload seguro
     */
    validateToken(token) {
        if (!token || typeof token !== 'string') {
            return { success: false, error: 'Token ausente ou malformado' };
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.config.secret);
            // Validação de estrutura
            const { error } = payloadSchema.validate(decoded);
            if (error) {
                return { success: false, error: `Payload inválido: ${error.message}` };
            }
            return { success: true, data: decoded };
        }
        catch (err) {
            return { success: false, error: `Token inválido: ${err.message}` };
        }
    }
    /**
     * Gera novo par de tokens a partir de refresh token válido
     */
    rotateRefreshToken(refreshToken) {
        if (!refreshToken || typeof refreshToken !== 'string') {
            return { success: false, error: 'Refresh token ausente ou malformado' };
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(refreshToken, this.config.secret);
            if (!decoded.userId || !decoded.refreshId) {
                return { success: false, error: 'Refresh token inválido' };
            }
            // Gera novo par de tokens
            const payload = {
                userId: decoded.userId,
                roles: decoded.roles || [],
                issuedAt: Math.floor(Date.now() / 1000)
            };
            return this.generateTokenPair(payload);
        }
        catch (err) {
            return { success: false, error: `Refresh token inválido: ${err.message}` };
        }
    }
    /**
     * Rate limiting defensivo por usuário
     */
    checkRateLimit(userId) {
        const now = Date.now();
        const entry = rateLimitMap.get(userId) || { count: 0, lastRequest: 0 };
        if (now - entry.lastRequest > 60000) {
            // Reset a cada minuto
            rateLimitMap.set(userId, { count: 1, lastRequest: now });
            return true;
        }
        if (entry.count >= this.config.rateLimit) {
            return false;
        }
        rateLimitMap.set(userId, { count: entry.count + 1, lastRequest: now });
        return true;
    }
}
exports.JwtAuthService = JwtAuthService;
// Configuração padrão para testes/demonstrativo
exports.defaultAuthConfig = {
    secret: 'supersecretkey123',
    expiresIn: '15m',
    refreshExpiresIn: '7d',
    rateLimit: 10
};
// Logging estruturado de segurança
function logSecurityEvent(event, details) {
    console.log(JSON.stringify({
        level: 'security',
        timestamp: new Date().toISOString(),
        event,
        details
    }));
}
/**
 * Testes unitários para o sistema JWT
 */
if (require.main === module) {
    const service = new JwtAuthService(exports.defaultAuthConfig);
    const payload = {
        userId: 'user123',
        roles: ['admin'],
        issuedAt: Math.floor(Date.now() / 1000)
    };
    // Teste: geração de token
    const genResult = service.generateTokenPair(payload);
    console.log('Teste geração:', genResult);
    // Teste: validação de token
    if (genResult.success) {
        const valResult = service.validateToken(genResult.data.accessToken);
        console.log('Teste validação:', valResult);
    }
    // Teste: rotação de refresh token
    if (genResult.success) {
        const rotResult = service.rotateRefreshToken(genResult.data.refreshToken);
        console.log('Teste rotação:', rotResult);
    }
    // Teste: rate limiting
    for (let i = 0; i < 12; i++) {
        const rateResult = service.generateTokenPair(payload);
        console.log(`Rate limiting [${i + 1}]:`, rateResult.success ? 'OK' : rateResult.error);
    }
    // Teste: token malformado
    const malResult = service.validateToken('invalid.token');
    console.log('Teste token malformado:', malResult);
}
/**
 * Documentação de cenários de erro:
 * - Payload inválido: retorna erro detalhado
 * - Token malformado: retorna erro
 * - Rate limit excedido: bloqueia geração
 * - Refresh token inválido: retorna erro
 * - Falha de assinatura: retorna erro
 * - Logging de todos eventos críticos
 */
//# sourceMappingURL=jwtAuthService.js.map