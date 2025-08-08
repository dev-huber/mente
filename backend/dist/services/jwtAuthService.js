"use strict";
/**
 * Serviço de Autenticação JWT para "Quem Mente Menos?"
 * Implementa autenticação segura com refresh tokens
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtAuthService = exports.JWTAuthService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const uuid_1 = require("uuid");
const logger_1 = require("@/utils/logger");
const CustomErrors_1 = require("@/core/errors/CustomErrors");
class JWTAuthService {
    accessTokenSecret;
    refreshTokenSecret;
    accessTokenExpiry = '15m';
    refreshTokenExpiry = '30d';
    saltRounds = 12;
    blacklistedTokens = new Set(); // TODO: Usar Redis em produção
    constructor() {
        // Validação de configuração
        this.accessTokenSecret = process.env.JWT_SECRET || '';
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || '';
        if (!this.accessTokenSecret || !this.refreshTokenSecret) {
            throw new Error('JWT secrets não configurados');
        }
        // Validar complexidade dos secrets
        if (this.accessTokenSecret.length < 32 || this.refreshTokenSecret.length < 32) {
            throw new Error('JWT secrets muito fracos (mínimo 32 caracteres)');
        }
    }
    async generateTokens(userId, email, role = 'user') {
        try {
            const jti = (0, uuid_1.v4)();
            const now = Math.floor(Date.now() / 1000);
            // Payload do token
            const payload = {
                sub: userId,
                email,
                role,
                iat: now,
                jti,
            };
            // Gerar access token
            const accessToken = jsonwebtoken_1.default.sign(payload, this.accessTokenSecret, {
                expiresIn: this.accessTokenExpiry,
                algorithm: 'HS256',
            });
            // Gerar refresh token
            const refreshToken = jsonwebtoken_1.default.sign({ ...payload, type: 'refresh' }, this.refreshTokenSecret, {
                expiresIn: this.refreshTokenExpiry,
                algorithm: 'HS256',
            });
            logger_1.logger.info('Tokens gerados com sucesso', {
                operation: 'generateTokens',
                service: 'JWTAuthService',
                userId,
                metadata: { jti, role },
            });
            return {
                accessToken,
                refreshToken,
                expiresIn: 15 * 60, // 15 minutos em segundos
            };
        }
        catch (error) {
            logger_1.logger.error('Falha ao gerar tokens', error, {
                operation: 'generateTokens',
                service: 'JWTAuthService',
                userId,
            });
            throw new CustomErrors_1.AuthenticationError('Falha ao gerar tokens de autenticação');
        }
    }
    async validateAccessToken(token) {
        try {
            // Verificar se token está na blacklist
            if (this.blacklistedTokens.has(token)) {
                throw new CustomErrors_1.AuthenticationError('Token revogado');
            }
            // Validar e decodificar token
            const payload = jsonwebtoken_1.default.verify(token, this.accessTokenSecret, {
                algorithms: ['HS256'],
            });
            // Validações adicionais
            if (!payload.sub || !payload.email || !payload.jti) {
                throw new CustomErrors_1.AuthenticationError('Token inválido');
            }
            // Verificar se token está na blacklist (usando jti)
            if (this.blacklistedTokens.has(payload.jti)) {
                throw new CustomErrors_1.AuthenticationError('Token revogado');
            }
            return payload;
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new CustomErrors_1.AuthenticationError('Token expirado');
            }
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new CustomErrors_1.AuthenticationError('Token inválido');
            }
            if (error instanceof CustomErrors_1.AuthenticationError) {
                throw error;
            }
            logger_1.logger.error('Erro ao validar token', error, {
                operation: 'validateAccessToken',
                service: 'JWTAuthService',
            });
            throw new CustomErrors_1.AuthenticationError('Falha na validação do token');
        }
    }
    async refreshTokens(refreshToken) {
        try {
            // Validar refresh token
            const payload = jsonwebtoken_1.default.verify(refreshToken, this.refreshTokenSecret, {
                algorithms: ['HS256'],
            });
            if (payload.type !== 'refresh') {
                throw new CustomErrors_1.AuthenticationError('Token inválido para refresh');
            }
            // Verificar blacklist
            if (this.blacklistedTokens.has(payload.jti)) {
                throw new CustomErrors_1.AuthenticationError('Refresh token revogado');
            }
            // Invalidar tokens antigos
            this.blacklistedTokens.add(payload.jti);
            // Gerar novos tokens
            return this.generateTokens(payload.sub, payload.email, payload.role);
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new CustomErrors_1.AuthenticationError('Refresh token expirado');
            }
            if (error instanceof CustomErrors_1.AuthenticationError) {
                throw error;
            }
            logger_1.logger.error('Erro ao renovar tokens', error, {
                operation: 'refreshTokens',
                service: 'JWTAuthService',
            });
            throw new CustomErrors_1.AuthenticationError('Falha ao renovar tokens');
        }
    }
    async hashPassword(password) {
        try {
            // Validar força da senha
            this.validatePasswordStrength(password);
            // Gerar salt e hash
            const salt = await bcrypt_1.default.genSalt(this.saltRounds);
            const hash = await bcrypt_1.default.hash(password, salt);
            return { hash, salt };
        }
        catch (error) {
            logger_1.logger.error('Erro ao hashear senha', error, {
                operation: 'hashPassword',
                service: 'JWTAuthService',
            });
            throw new Error('Falha ao processar senha');
        }
    }
    async verifyPassword(password, hash) {
        try {
            return await bcrypt_1.default.compare(password, hash);
        }
        catch (error) {
            logger_1.logger.error('Erro ao verificar senha', error, {
                operation: 'verifyPassword',
                service: 'JWTAuthService',
            });
            return false;
        }
    }
    revokeToken(token) {
        try {
            const payload = jsonwebtoken_1.default.decode(token);
            if (payload?.jti) {
                this.blacklistedTokens.add(payload.jti);
                logger_1.logger.info('Token revogado', {
                    operation: 'revokeToken',
                    service: 'JWTAuthService',
                    metadata: { jti: payload.jti },
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Erro ao revogar token', error, {
                operation: 'revokeToken',
                service: 'JWTAuthService',
            });
        }
    }
    validatePasswordStrength(password) {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        if (password.length < minLength) {
            throw new Error(`Senha deve ter no mínimo ${minLength} caracteres`);
        }
        if (!hasUpperCase || !hasLowerCase) {
            throw new Error('Senha deve conter letras maiúsculas e minúsculas');
        }
        if (!hasNumbers) {
            throw new Error('Senha deve conter números');
        }
        if (!hasSpecialChar) {
            throw new Error('Senha deve conter caracteres especiais');
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}
exports.JWTAuthService = JWTAuthService;
// Singleton export
exports.jwtAuthService = new JWTAuthService();
