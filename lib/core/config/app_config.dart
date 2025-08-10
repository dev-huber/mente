import 'package:flutter/foundation.dart';

/// Configuration class for environment-specific settings
class AppConfig {
  static const String _prodApiUrl = 'https://quem-mente-menos-api.azurewebsites.net';
  static const String _devApiUrl = 'http://localhost:7071';
  
  /// Get the appropriate API base URL based on the environment
  static String get apiBaseUrl {
    // Use production URL when running in release mode (GitHub Pages)
    // Use development URL when running in debug mode (local development)
    return kDebugMode ? _devApiUrl : _prodApiUrl;
  }
  
  /// Audio upload endpoint
  static String get audioUploadEndpoint => '$apiBaseUrl/api/audioUpload';
  
  /// Health check endpoint
  static String get healthEndpoint => '$apiBaseUrl/api/health';
  
  /// Check if running in production environment
  static bool get isProduction => !kDebugMode;
  
  /// Check if running in development environment
  static bool get isDevelopment => kDebugMode;
  
  /// API timeout duration
  static const Duration apiTimeout = Duration(seconds: 30);
  
  /// Upload timeout duration
  static const Duration uploadTimeout = Duration(minutes: 5);
  
  /// Max retry attempts for network requests
  static const int maxRetries = 3;
  
  /// App version
  static const String version = '1.0.0';
  
  /// User agent for HTTP requests
  static String get userAgent => 'MentiraApp-Flutter/$version';
}
