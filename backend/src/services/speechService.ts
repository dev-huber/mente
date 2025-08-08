/**
 * Serviço de Speech-to-Text Simplificado
 * Mock implementation para desenvolvimento
 */

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration: number;
  segments: any[];
}

export interface SpeechRecognitionResult {
  success: boolean;
  transcription: string;
  confidence: number;
}

export class SpeechService {
  constructor() {
    console.log('[SpeechService] Initialized (Mock Mode)');
  }
  
  async transcribeAudio(audioBuffer: Buffer, language: string = 'pt-BR'): Promise<TranscriptionResult> {
    console.log('[SpeechService] Transcribing audio (mock)...');
    
    // Simulate processing time
    await this.delay(1000);
    
    // Mock transcription result
    const mockTexts = [
      'Esta é uma transcrição de exemplo para teste.',
      'O sistema está funcionando corretamente.',
      'Podemos detectar mentiras com alta precisão.',
      'A análise de áudio está sendo processada.'
    ];
    
    const randomText = mockTexts[Math.floor(Math.random() * mockTexts.length)];
    
    return {
      text: randomText,
      confidence: 0.85 + Math.random() * 0.14, // 85-99%
      language,
      duration: 5.0 + Math.random() * 10, // 5-15 seconds
      segments: [
        {
          text: randomText,
          start: 0,
          end: 5.0,
          confidence: 0.9
        }
      ]
    };
  }
  
  async detectLanguage(audioBuffer: Buffer): Promise<string> {
    console.log('[SpeechService] Detecting language (mock)...');
    // Always return Portuguese for mock
    return 'pt-BR';
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const speechService = new SpeechService();