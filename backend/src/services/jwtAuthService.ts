/**
 * Serviço de Autenticação JWT para "Quem Mente Menos?"
 * Implementa autenticação segura com refresh tokens
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/utils/logger';
import { AuthenticationError, AuthorizationError } from '@/core/errors/CustomErrors';

export interface TokenPayload {
  sub: string; // userId
  email: string;
  role: 'user' | 'premium' | 'admin';
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export interface HashedPassword {
  hash: string;
  salt: string;
}

export class JWTAuthService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '30d';
  private readonly saltRounds = 12;
  private blacklistedTokens = new Set<string>(); // TODO: Usar Redis em produção
  
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
  
  async generateTokens(userId: string, email: string, role: 'user' | 'premium' | 'admin' = 'user'): Promise<TokenPair> {
    try {
      const jti = uuidv4();
      const now = Math.floor(Date.now() / 1000);
      
      // Payload do token
      const payload: Omit<TokenPayload, 'exp'> = {
        sub: userId,
        email,
        role,
        iat: now,
        jti,
      };
      
      // Gerar access token
      const accessToken = jwt.sign(payload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        algorithm: 'HS256',
      });
      
      // Gerar refresh token
      const refreshToken = jwt.sign(
        { ...payload, type: 'refresh' },
        this.refreshTokenSecret,
        {
          expiresIn: this.refreshTokenExpiry,
          algorithm: 'HS256',
        }
      );
      
      logger.info('Tokens gerados com sucesso', {
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
      
    } catch (error) {
      logger.error('Falha ao gerar tokens', error, {
        operation: 'generateTokens',
        service: 'JWTAuthService',
        userId,
      });
      
      throw new AuthenticationError('Falha ao gerar tokens de autenticação');
    }
  }
  
  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      // Verificar se token está na blacklist
      if (this.blacklistedTokens.has(token)) {
        throw new AuthenticationError('Token revogado');
      }
      
      // Validar e decodificar token
      const payload = jwt.verify(token, this.accessTokenSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload;
      
      // Validações adicionais
      if (!payload.sub || !payload.email || !payload.jti) {
        throw new AuthenticationError('Token inválido');
      }
      
      // Verificar se token está na blacklist (usando jti)
      if (this.blacklistedTokens.has(payload.jti)) {
        throw new AuthenticationError('Token revogado');
      }
      
      return payload;
      
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token expirado');
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Token inválido');
      }
      
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      logger.error('Erro ao validar token', error, {
        operation: 'validateAccessToken',
        service: 'JWTAuthService',
      });
      
      throw new AuthenticationError('Falha na validação do token');
    }
  }
  
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Validar refresh token
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret, {
        algorithms: ['HS256'],
      }) as any;
      
      if (payload.type !== 'refresh') {
        throw new AuthenticationError('Token inválido para refresh');
      }
      
      // Verificar blacklist
      if (this.blacklistedTokens.has(payload.jti)) {
        throw new AuthenticationError('Refresh token revogado');
      }
      
      // Invalidar tokens antigos
      this.blacklistedTokens.add(payload.jti);
      
      // Gerar novos tokens
      return this.generateTokens(payload.sub, payload.email, payload.role);
      
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Refresh token expirado');
      }
      
      if (error instanceof AuthenticationError) {
        throw error;
      }
      
      logger.error('Erro ao renovar tokens', error, {
        operation: 'refreshTokens',
        service: 'JWTAuthService',
      });
      
      throw new AuthenticationError('Falha ao renovar tokens');
    }
  }
  
  async hashPassword(password: string): Promise<HashedPassword> {
    try {
      // Validar força da senha
      this.validatePasswordStrength(password);
      
      // Gerar salt e hash
      const salt = await bcrypt.genSalt(this.saltRounds);
      const hash = await bcrypt.hash(password, salt);
      
      return { hash, salt };
      
    } catch (error) {
      logger.error('Erro ao hashear senha', error, {
        operation: 'hashPassword',
        service: 'JWTAuthService',
      });
      
      throw new Error('Falha ao processar senha');
    }
  }
  
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch (error) {
      logger.error('Erro ao verificar senha', error, {
        operation: 'verifyPassword',
        service: 'JWTAuthService',
      });
      
      return false;
    }
  }
  
  revokeToken(token: string): void {
    try {
      const payload = jwt.decode(token) as any;
      if (payload?.jti) {
        this.blacklistedTokens.add(payload.jti);
        
        logger.info('Token revogado', {
          operation: 'revokeToken',
          service: 'JWTAuthService',
          metadata: { jti: payload.jti },
        });
      }
    } catch (error) {
      logger.error('Erro ao revogar token', error, {
        operation: 'revokeToken',
        service: 'JWTAuthService',
      });
    }
  }
  
  private validatePasswordStrength(password: string): void {
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
  
  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    return authHeader.substring(7);
  }
}

// Singleton export
export const jwtAuthService = new JWTAuthService();
