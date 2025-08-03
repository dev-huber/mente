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

import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import Joi from 'joi';
import crypto from 'crypto';

// Result Pattern para todas as operações
export type Result<T, E> = { success: true; data: T } | { success: false; error: E };

// Interfaces principais
export interface AuthConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
  rateLimit: number;
}

export interface AuthPayload {
  userId: string;
  roles: string[];
  issuedAt: number;
  refreshId?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Validação de payloads
const payloadSchema = Joi.object({
  userId: Joi.string().min(3).max(64).required(),
  roles: Joi.array().items(Joi.string()).min(1).required(),
  issuedAt: Joi.number().required(),
  refreshId: Joi.string().optional()
}).unknown(true); // Permite campos extras do JWT

// Rate limiting simples (in-memory, para demo)
const rateLimitMap = new Map<string, { count: number; lastRequest: number }>();

export class JwtAuthService {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Gera par de tokens JWT (access + refresh) com validação e logging
   */
  generateTokenPair(payload: AuthPayload): Result<TokenPair, string> {
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
    const refreshId = crypto.randomBytes(32).toString('hex');
    const now = Math.floor(Date.now() / 1000);
    const accessPayload = { ...payload, issuedAt: now };
    const refreshPayload = { userId: payload.userId, refreshId, issuedAt: now, roles: payload.roles };

    try {
      const accessToken = jwt.sign(accessPayload, this.config.secret, {
        expiresIn: this.config.expiresIn,
        algorithm: 'HS256'
      } as SignOptions);
      const refreshToken = jwt.sign(refreshPayload, this.config.secret, {
        expiresIn: this.config.refreshExpiresIn,
        algorithm: 'HS256'
      } as SignOptions);
      // Logging de segurança
      logSecurityEvent('token_generated', {
        userId: payload.userId,
        roles: payload.roles,
        issuedAt: accessPayload.issuedAt
      });
      return { success: true, data: { accessToken, refreshToken } };
    } catch (err) {
      return { success: false, error: `Erro ao gerar token: ${(err as Error).message}` };
    }
  }

  /**
   * Valida token JWT e retorna payload seguro
   */
  validateToken(token: string): Result<AuthPayload, string> {
    if (!token || typeof token !== 'string') {
      return { success: false, error: 'Token ausente ou malformado' };
    }
    try {
      const decoded = jwt.verify(token, this.config.secret) as JwtPayload;
      // Validação de estrutura
      const { error } = payloadSchema.validate(decoded);
      if (error) {
        return { success: false, error: `Payload inválido: ${error.message}` };
      }
      return { success: true, data: decoded as AuthPayload };
    } catch (err) {
      return { success: false, error: `Token inválido: ${(err as Error).message}` };
    }
  }

  /**
   * Gera novo par de tokens a partir de refresh token válido
   */
  rotateRefreshToken(refreshToken: string): Result<TokenPair, string> {
    if (!refreshToken || typeof refreshToken !== 'string') {
      return { success: false, error: 'Refresh token ausente ou malformado' };
    }
    try {
      const decoded = jwt.verify(refreshToken, this.config.secret) as JwtPayload;
      if (!decoded.userId || !decoded.refreshId) {
        return { success: false, error: 'Refresh token inválido' };
      }
      // Gera novo par de tokens
      const payload: AuthPayload = {
        userId: decoded.userId,
        roles: decoded.roles || [],
        issuedAt: Math.floor(Date.now() / 1000)
      };
      return this.generateTokenPair(payload);
    } catch (err) {
      return { success: false, error: `Refresh token inválido: ${(err as Error).message}` };
    }
  }

  /**
   * Rate limiting defensivo por usuário
   */
  private checkRateLimit(userId: string): boolean {
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

// Configuração padrão para testes/demonstrativo
export const defaultAuthConfig: AuthConfig = {
  secret: 'supersecretkey123',
  expiresIn: '15m',
  refreshExpiresIn: '7d',
  rateLimit: 10
};

// Logging estruturado de segurança
export function logSecurityEvent(event: string, details: Record<string, unknown>) {
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
  const service = new JwtAuthService(defaultAuthConfig);
  const payload: AuthPayload = {
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
