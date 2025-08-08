/**
 * Serviço de Autenticação JWT para "Quem Mente Menos?"
 * Implementa autenticação segura com refresh tokens
 */
export interface TokenPayload {
    sub: string;
    email: string;
    role: 'user' | 'premium' | 'admin';
    iat: number;
    exp: number;
    jti: string;
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
export declare class JWTAuthService {
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    private readonly saltRounds;
    private blacklistedTokens;
    constructor();
    generateTokens(userId: string, email: string, role?: 'user' | 'premium' | 'admin'): Promise<TokenPair>;
    validateAccessToken(token: string): Promise<TokenPayload>;
    refreshTokens(refreshToken: string): Promise<TokenPair>;
    hashPassword(password: string): Promise<HashedPassword>;
    verifyPassword(password: string, hash: string): Promise<boolean>;
    revokeToken(token: string): void;
    private validatePasswordStrength;
    extractTokenFromHeader(authHeader: string | null): string | null;
}
export declare const jwtAuthService: JWTAuthService;
//# sourceMappingURL=jwtAuthService.d.ts.map