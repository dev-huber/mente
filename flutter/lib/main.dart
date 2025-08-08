import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mentira_app/core/config/app_config.dart';
import 'package:mentira_app/core/error/error_boundary.dart';
import 'package:mentira_app/core/theme/app_theme.dart';
import 'package:mentira_app/features/audio/presentation/pages/audio_capture_page.dart';

Future<void> main() async {
  // Garantir inicialização dos bindings
  WidgetsFlutterBinding.ensureInitialized();
  
  // Configurar error handling global
  await setupErrorHandling();
  
  // Rodar app com error boundary
  runApp(
    ProviderScope(
      child: ErrorBoundary(
        child: const MentiraApp(),
      ),
    ),
  );
}

Future<void> setupErrorHandling() async {
  // Capturar erros do Flutter
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    // Log para debugging
    debugPrint('Flutter Error: ${details.exception}');
  };
}

class MentiraApp extends ConsumerWidget {
  const MentiraApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Quem Mente Menos?',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      debugShowCheckedModeBanner: false,
      home: const AudioCapturePage(),
    );
  }
}