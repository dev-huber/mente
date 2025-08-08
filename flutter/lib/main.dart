import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quem_mente_menos/core/config/app_config.dart';
import 'package:quem_mente_menos/core/error/error_boundary.dart';
import 'package:quem_mente_menos/core/theme/app_theme.dart';
import 'package:quem_mente_menos/features/audio/presentation/pages/audio_capture_page.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

Future<void> main() async {
  // Garantir inicialização dos bindings
  WidgetsFlutterBinding.ensureInitialized();
  
  // Configurar error handling global
  await setupErrorHandling();
  
  // Inicializar configurações
  await AppConfig.initialize();
  
  // Rodar app com error boundary
  await SentryFlutter.init(
    (options) {
      options.dsn = AppConfig.sentryDsn;
      options.tracesSampleRate = 1.0;
      options.environment = AppConfig.environment;
    },
    appRunner: () => runApp(
      ProviderScope(
        child: ErrorBoundary(
          child: const QuemMenteMenosApp(),
        ),
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
    // Enviar para Sentry em produção
    if (!AppConfig.isDevelopment) {
      Sentry.captureException(details.exception, stackTrace: details.stack);
    }
  };
}

class QuemMenteMenosApp extends ConsumerWidget {
  const QuemMenteMenosApp({super.key});

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