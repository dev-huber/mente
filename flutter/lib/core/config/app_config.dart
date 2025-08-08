/// Configurações da aplicação
class AppConfig {
  // URLs da API
  static const String baseUrl = 'https://dev-huber.github.io/mente';
  static const String apiUrl = '$baseUrl/api';
  
  // Configurações de áudio
  static const Duration maxRecordingDuration = Duration(minutes: 5);
  static const int sampleRate = 44100;
  static const String audioFormat = 'wav';
  
  // Configurações de análise
  static const double confidenceThreshold = 0.7;
  static const int analysisTimeout = 30; // segundos
  
  // Features habilitadas
  static const bool enableSentry = false;
  static const bool enableAnalytics = false;
  static const bool enableDebugMode = true;
  
  // Configurações de cache
  static const Duration cacheValidityDuration = Duration(hours: 24);
  static const int maxCacheSize = 50; // MB
}
