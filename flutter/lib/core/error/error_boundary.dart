import 'package:flutter/material.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

/// Error Boundary Widget - Defensive Programming para Flutter
/// Captura e trata erros em toda a árvore de widgets
class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget Function(FlutterErrorDetails)? errorBuilder;
  
  const ErrorBoundary({
    super.key,
    required this.child,
    this.errorBuilder,
  });
  
  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  FlutterErrorDetails? _errorDetails;
  
  @override
  void initState() {
    super.initState();
    // Substituir error widget padrão
    ErrorWidget.builder = (FlutterErrorDetails details) {
      // Log do erro
      debugPrint('ErrorBoundary caught: ${details.exception}');
      
      // Enviar para Sentry em produção
      Sentry.captureException(
        details.exception,
        stackTrace: details.stack,
      );
      
      // Atualizar estado se for nosso widget
      if (mounted) {
        setState(() {
          _errorDetails = details;
        });
      }
      
      // Retornar widget de erro customizado
      return _buildErrorWidget(details);
    };
  }
  
  Widget _buildErrorWidget(FlutterErrorDetails details) {
    if (widget.errorBuilder != null) {
      return widget.errorBuilder!(details);
    }
    
    return MaterialApp(
      home: Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    color: Colors.red,
                    size: 64,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Ops! Algo deu errado',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Encontramos um erro inesperado.',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // Resetar estado
                      setState(() {
                        _errorDetails = null;
                      });
                    },
                    child: const Text('Tentar Novamente'),
                  ),
                  if (const bool.fromEnvironment('dart.vm.product') == false) ...[
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        details.exception.toString(),
                        style: const TextStyle(
                          fontSize: 12,
                          fontFamily: 'monospace',
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
  
  @override
  Widget build(BuildContext context) {
    if (_errorDetails != null) {
      return _buildErrorWidget(_errorDetails!);
    }
    
    return widget.child;
  }
}
