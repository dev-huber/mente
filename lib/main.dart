import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'pages/simple_audio_capture_page.dart';

/// Main application with defensive initialization and error boundaries
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set up global error handling
  FlutterError.onError = (FlutterErrorDetails details) {
    debugPrint('Flutter Error: ${details.exception}');
    debugPrint('Stack Trace: ${details.stack}');
  };

  runApp(
    const ProviderScope(
      child: MentiraApp(),
    ),
  );
}

/// Root application widget with provider setup and error boundaries
class MentiraApp extends StatelessWidget {
  const MentiraApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Quem Mente Menos?',
      debugShowCheckedModeBanner: false,
      theme: _buildAppTheme(),
      home: const ErrorBoundary(
        child: AudioCapturePage(),
      ),
      builder: (context, child) {
        // Global error boundary wrapper
        return ErrorBoundary(
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }

  /// Build app theme with consistent design system
  ThemeData _buildAppTheme() {
    return ThemeData(
      primarySwatch: Colors.deepPurple,
      primaryColor: Colors.deepPurple,
      scaffoldBackgroundColor: Colors.grey[50],
      
      // AppBar theme
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      
      // Card theme
      cardTheme: CardTheme(
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        color: Colors.white,
      ),
      
      // Button theme
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.deepPurple,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          padding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 12,
          ),
        ),
      ),
      
      // Text theme
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.w300,
          color: Colors.black87,
        ),
        headlineMedium: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w400,
          color: Colors.black87,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w400,
          color: Colors.black87,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w400,
          color: Colors.black87,
        ),
      ),
      
      // Color scheme
      colorScheme: ColorScheme.fromSeed(
        seedColor: Colors.deepPurple,
        brightness: Brightness.light,
      ),
      
      useMaterial3: true,
    );
  }
}

/// Error boundary widget for handling unexpected errors
class ErrorBoundary extends StatefulWidget {
  final Widget child;
  final Widget? errorWidget;

  const ErrorBoundary({
    Key? key,
    required this.child,
    this.errorWidget,
  }) : super(key: key);

  @override
  State<ErrorBoundary> createState() => _ErrorBoundaryState();
}

class _ErrorBoundaryState extends State<ErrorBoundary> {
  bool _hasError = false;
  Object? _error;
  StackTrace? _stackTrace;

  @override
  void initState() {
    super.initState();
    
    // Reset error state when widget is recreated
    _hasError = false;
    _error = null;
    _stackTrace = null;
  }

  @override
  Widget build(BuildContext context) {
    if (_hasError) {
      return widget.errorWidget ?? _buildDefaultErrorWidget();
    }

    return ErrorCapture(
      onError: _handleError,
      child: widget.child,
    );
  }

  /// Handle captured errors
  void _handleError(Object error, StackTrace stackTrace) {
    debugPrint('Error captured by ErrorBoundary: $error');
    debugPrint('Stack trace: $stackTrace');
    
    setState(() {
      _hasError = true;
      _error = error;
      _stackTrace = stackTrace;
    });
  }

  /// Build default error widget
  Widget _buildDefaultErrorWidget() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Error'),
        backgroundColor: Colors.red,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: Colors.red,
              ),
              const SizedBox(height: 16),
              const Text(
                'Something went wrong',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _error?.toString() ?? 'Unknown error occurred',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _resetError,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                ),
                child: const Text('Try Again'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: _showErrorDetails,
                child: const Text('Show Details'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Reset error state
  void _resetError() {
    setState(() {
      _hasError = false;
      _error = null;
      _stackTrace = null;
    });
  }

  /// Show detailed error information
  void _showErrorDetails() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error Details'),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Error:',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              Text(_error?.toString() ?? 'Unknown error'),
              const SizedBox(height: 16),
              if (_stackTrace != null) ...[
                Text(
                  'Stack Trace:',
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  _stackTrace.toString(),
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 12,
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }
}

/// Widget to capture errors from child widgets
class ErrorCapture extends StatelessWidget {
  final Widget child;
  final void Function(Object error, StackTrace stackTrace) onError;

  const ErrorCapture({
    Key? key,
    required this.child,
    required this.onError,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Builder(
      builder: (context) {
        try {
          return child;
        } catch (error, stackTrace) {
          onError(error, stackTrace);
          return const SizedBox.shrink();
        }
      },
    );
  }
}
