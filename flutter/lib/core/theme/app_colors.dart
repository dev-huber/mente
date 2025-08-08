import 'package:flutter/material.dart';

/// Definição das cores do tema da aplicação
class AppColors {
  // Cores primárias
  static const Color primary = Color(0xFF2196F3);
  static const Color primaryDark = Color(0xFF1976D2);
  static const Color primaryLight = Color(0xFFBBDEFB);
  
  // Cores de fundo
  static const Color background = Color(0xFFFAFAFA);
  static const Color surface = Colors.white;
  static const Color cardBackground = Colors.white;
  
  // Cores de texto
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textHint = Color(0xFFBDBDBD);
  
  // Cores de estado
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFF9800);
  static const Color error = Color(0xFFFF5722);
  static const Color info = Color(0xFF2196F3);
  
  // Cores específicas para gravação
  static const Color recording = Color(0xFFFF5722);
  static const Color recordingLight = Color(0xFFFFCDD2);
  static const Color analysisBlue = Color(0xFF1976D2);
  static const Color waveformActive = Color(0xFF2196F3);
  static const Color waveformInactive = Color(0xFFE0E0E0);
  
  // Gradientes
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryDark],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient recordingGradient = LinearGradient(
    colors: [recording, Color(0xFFD32F2F)],
    begin: Alignment.topCenter,
    end: Alignment.bottomCenter,
  );
}
