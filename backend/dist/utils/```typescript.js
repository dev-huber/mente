"use strict";
`` `typescript
/**
 * Testes do Serviço de Detecção de Mentiras
 * Cobertura completa com casos edge
 */

import { LieDetectionService } from '@/services/lieDetectionService';
import { BusinessLogicError } from '@/core/errors/CustomErrors';

describe('LieDetectionService', () => {
  let service: LieDetectionService;
  
  beforeEach(() => {
    service = new LieDetectionService();
  });
  
  describe('detectLie', () => {
    it('deve detectar mentira óbvia com alta confiança', async () => {
      const input = {
        transcription: {
          text: 'Eu... uh... não, quer dizer, eu nunca... hmm... não fiz isso, tipo, sabe...',
          words: [],
          language: 'pt',
        },
        vocalAnalysis: {
          pitchMean: 200,
          pitchStd: 60,
          energyMean: 60,
          energyStd: 45,
          speakingRate: 90,
          pauseRatio: 0.45,
        },
        sentiment: {
          positive: 0.1,
          negative: 0.7,
          neutral: 0.2,
          intensity: 0.9,
        },
      };
      
      const result = await service.detectLie(input);
      
      expect(result.lieScore).toBeGreaterThan(70);
      expect(result.confidence).toBeGreaterThan(70);
      expect(result.classification).toBe('lie');
      expect(result.keyIndicators).toContain('Padrões linguísticos suspeitos detectados');
    });
    
    it('deve detectar verdade com indicadores normais', async () => {
      const input = {
        transcription: {
          text: 'Sim, eu estava em casa ontem à noite assistindo televisão com minha família.',
          words: [],
          language: 'pt',
        },
        vocalAnalysis: {
          pitchMean: 150,
          pitchStd: 20,
          energyMean: 50,
          energyStd: 15,
          speakingRate: 150,
          pauseRatio: 0.15,
        },
        sentiment: {
          positive: 0.3,
          negative: 0.2,
          neutral: 0.5,
          intensity: 0.5,
        },
      };
      
      const result = await service.detectLie(input);
      
      expect(result.lieScore).toBeLessThan(30);
      expect(result.classification).toBe('truth');
    });
    
    it('deve retornar incerto com dados insuficientes', async () => {
      const input = {
        transcription: {
          text: 'Sim.',
          words: [],
          language: 'pt',
        },
        vocalAnalysis: {
          pitchMean: 150,
          pitchStd: 25,
          energyMean: 50,
          energyStd: 20,
          speakingRate: 150,
          pauseRatio: 0.2,
        },
        sentiment: {
          positive: 0.33,
          negative: 0.33,
          neutral: 0.34,
          intensity: 0.5,
        },
      };
      
      await expect(service.detectLie(input)).rejects.toThrow(BusinessLogicError);
    });
  });
});
` ``;
//# sourceMappingURL=%60%60%60typescript.js.map