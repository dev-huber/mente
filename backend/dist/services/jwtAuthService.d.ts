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
export type Result<T, E> = {
    success: true;
    data: T;
} | {
    success: false;
    error: E;
};
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
export declare class JwtAuthService {
    private config;
    constructor(config: AuthConfig);
    /**
     * Gera par de tokens JWT (access + refresh) com validação e logging
     */
    generateTokenPair(payload: AuthPayload): Result<TokenPair, string>;
    /**
     * Valida token JWT e retorna payload seguro
     */
    validateToken(token: string): Result<AuthPayload, string>;
    /**
     * Gera novo par de tokens a partir de refresh token válido
     */
    rotateRefreshToken(refreshToken: string): Result<TokenPair, string>;
    /**
     * Rate limiting defensivo por usuário
     */
    private checkRateLimit;
}
export declare const defaultAuthConfig: AuthConfig;
export declare function logSecurityEvent(event: string, details: Record<string, unknown>): void;
/**
 * Documentação de cenários de erro:
 * - Payload inválido: retorna erro detalhado
 * - Token malformado: retorna erro
 * - Rate limit excedido: bloqueia geração
 * - Refresh token inválido: retorna erro
 * - Falha de assinatura: retorna erro
 * - Logging de todos eventos críticos
 */
//# sourceMappingURL=jwtAuthService.d.ts.map