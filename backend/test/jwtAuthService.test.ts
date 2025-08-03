/**
 * Testes unitários para JwtAuthService - cobertura de todos os cenários críticos
 */
import { JwtAuthService, defaultAuthConfig, AuthPayload, Result, TokenPair } from '../src/services/jwtAuthService';

describe('JwtAuthService', () => {
  const service = new JwtAuthService(defaultAuthConfig);
  const validPayload: AuthPayload = {
    userId: 'user123',
    roles: ['admin'],
    issuedAt: Math.floor(Date.now() / 1000)
  };


  it('deve gerar par de tokens válidos', () => {
    const result = service.generateTokenPair(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.accessToken).toBeDefined();
      expect(result.data.refreshToken).toBeDefined();
    }
  });

  it('deve validar token gerado', () => {
    const genResult = service.generateTokenPair(validPayload);
    if (genResult.success) {
      const valResult = service.validateToken(genResult.data.accessToken);
      expect(valResult.success).toBe(true);
      if (valResult.success) {
        expect(valResult.data.userId).toBe(validPayload.userId);
      }
    }
  });

  it('deve rejeitar payload inválido', () => {
    const badPayload = { ...validPayload, userId: '' };
    const result = service.generateTokenPair(badPayload as AuthPayload);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Payload inválido');
    }
  });

  it('deve rejeitar token malformado', () => {
    const result = service.validateToken('invalid.token');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Token inválido');
    }
  });

  it('deve respeitar rate limiting', () => {
    let lastResult: Result<TokenPair, string> = { success: true, data: { accessToken: '', refreshToken: '' } };
    for (let i = 0; i < defaultAuthConfig.rateLimit + 2; i++) {
      lastResult = service.generateTokenPair(validPayload);
    }
    expect(lastResult.success).toBe(false);
    if (!lastResult.success) {
      expect(lastResult.error).toContain('Rate limit excedido');
    }
  });

  it('deve rotacionar refresh token válido', () => {
    const genResult = service.generateTokenPair(validPayload);
    if (genResult.success) {
      const rotResult = service.rotateRefreshToken(genResult.data.refreshToken);
      expect(rotResult.success).toBe(true);
      if (rotResult.success) {
        expect(rotResult.data.accessToken).toBeDefined();
        expect(rotResult.data.refreshToken).toBeDefined();
      }
    }
  });

  it('deve rejeitar refresh token inválido', () => {
    const result = service.rotateRefreshToken('invalid.token');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Refresh token inválido');
    }
  });

  it('deve logar eventos de segurança', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    service.generateTokenPair(validPayload);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
