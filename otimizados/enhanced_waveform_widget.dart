import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'dart:math' as math;
import 'dart:async';

/// High-performance waveform visualization widget with frame rate optimization
/// Implements defensive programming with graceful degradation and memory efficiency
class AudioWaveformWidget extends StatefulWidget {
  final Stream<double> amplitudeStream;
  final bool isRecording;
  final Duration duration;
  final Color waveColor;
  final Color backgroundColor;
  final double height;
  final int maxBars;
  final double frameRate; // New: configurable frame rate

  const AudioWaveformWidget({
    Key? key,
    required this.amplitudeStream,
    required this.isRecording,
    required this.duration,
    this.waveColor = Colors.blue,
    this.backgroundColor = Colors.transparent,
    this.height = 100.0,
    this.maxBars = 50,
    this.frameRate = 30.0, // 30 FPS default for smooth performance
  }) : super(key: key);

  @override
  State<AudioWaveformWidget> createState() => _AudioWaveformWidgetState();
}

class _AudioWaveformWidgetState extends State<AudioWaveformWidget>
    with TickerProviderStateMixin {
  
  // Animation controllers with proper lifecycle management
  late AnimationController _pulseAnimationController;
  late AnimationController _waveAnimationController;
  late Animation<double> _pulseAnimation;
  late Animation<double> _waveAnimation;
  
  // Performance-optimized data structures
  final List<double> _amplitudeHistory = <double>[];
  double _currentAmplitude = 0.0;
  
  // Frame rate limiting for performance
  DateTime _lastUpdateTime = DateTime.now();
  late Duration _updateThrottle;
  
  // Stream subscription with error handling
  StreamSubscription<double>? _amplitudeSubscription;
  
  // Performance monitoring
  int _frameDropCount = 0;
  int _totalFrames = 0;
  Timer? _performanceTimer;
  
  // Error state management
  bool _hasStreamError = false;
  String? _errorMessage;
  
  // Memory management
  Timer? _cleanupTimer;
  bool _isDisposed = false;

  @override
  void initState() {
    super.initState();
    
    // Calculate update throttle based on desired frame rate
    _updateThrottle = Duration(milliseconds: (1000 / widget.frameRate).round());
    
    _initializeAnimations();
    _startPerformanceMonitoring();
    _startMemoryManagement();
    _subscribeToAmplitudeStream();
  }

  /// Initialize animation controllers with defensive configuration
  void _initializeAnimations() {
    try {
      // Pulse animation for recording indicator
      _pulseAnimationController = AnimationController(
        duration: const Duration(milliseconds: 1200),
        vsync: this,
      );
      
      _pulseAnimation = Tween<double>(
        begin: 0.8,
        end: 1.0,
      ).animate(CurvedAnimation(
        parent: _pulseAnimationController,
        curve: Curves.easeInOut,
      ));

      // Wave animation for smooth transitions
      _waveAnimationController = AnimationController(
        duration: const Duration(milliseconds: 300),
        vsync: this,
      );
      
      _waveAnimation = Tween<double>(
        begin: 0.0,
        end: 1.0,
      ).animate(CurvedAnimation(
        parent: _waveAnimationController,
        curve: Curves.easeOut,
      ));

      // Start pulse animation if recording
      if (widget.isRecording) {
        _pulseAnimationController.repeat(reverse: true);
      }

    } catch (e) {
      debugPrint('Error initializing animations: $e');
      _setErrorState('Animation initialization failed');
    }
  }

  /// Subscribe to amplitude stream with comprehensive error handling
  void _subscribeToAmplitudeStream() {
    try {
      _amplitudeSubscription = widget.amplitudeStream.listen(
        _onAmplitudeUpdate,
        onError: _onAmplitudeError,
        onDone: () => debugPrint('Amplitude stream completed'),
        cancelOnError: false, // Keep listening after errors
      );
    } catch (e) {
      debugPrint('Error subscribing to amplitude stream: $e');
      _setErrorState('Stream subscription failed');
    }
  }

  /// Start performance monitoring
  void _startPerformanceMonitoring() {
    _performanceTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _analyzePerformance();
    });
  }

  /// Start memory management timer
  void _startMemoryManagement() {
    _cleanupTimer = Timer.periodic(const Duration(minutes: 2), (_) {
      _performMemoryCleanup();
    });
  }

  /// Analyze performance and adjust settings
  void _analyzePerformance() {
    if (_isDisposed) return;

    try {
      if (_totalFrames > 0) {
        final dropRate = _frameDropCount / _totalFrames;
        
        if (dropRate > 0.1) { // More than 10% frame drops
          debugPrint('High frame drop rate detected: ${(dropRate * 100).toStringAsFixed(1)}%');
          
          // Reduce update frequency to improve performance
          _updateThrottle = Duration(
            milliseconds: (_updateThrottle.inMilliseconds * 1.2).round(),
          );
        }
      }
      
      // Reset counters
      _frameDropCount = 0;
      _totalFrames = 0;
    } catch (e) {
      debugPrint('Error analyzing performance: $e');
    }
  }

  /// Perform memory cleanup
  void _performMemoryCleanup() {
    if (_isDisposed) return;

    try {
      // Trim amplitude history if too large
      if (_amplitudeHistory.length > widget.maxBars * 2) {
        final excess = _amplitudeHistory.length - widget.maxBars;
        _amplitudeHistory.removeRange(0, excess);
        debugPrint('Cleaned up $excess old amplitude entries');
      }
    } catch (e) {
      debugPrint('Error during memory cleanup: $e');
    }
  }

  @override
  void didUpdateWidget(AudioWaveformWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    try {
      // Handle recording state changes
      if (widget.isRecording != oldWidget.isRecording) {
        if (widget.isRecording) {
          _pulseAnimationController.repeat(reverse: true);
          _waveAnimationController.forward();
        } else {
          _pulseAnimationController.stop();
          _pulseAnimationController.reset();
          _waveAnimationController.reverse();
        }
      }

      // Handle stream changes
      if (widget.amplitudeStream != oldWidget.amplitudeStream) {
        _amplitudeSubscription?.cancel();
        _subscribeToAmplitudeStream();
      }

      // Update throttle if frame rate changed
      if (widget.frameRate != oldWidget.frameRate) {
        _updateThrottle = Duration(
          milliseconds: (1000 / widget.frameRate).round(),
        );
      }
    } catch (e) {
      debugPrint('Error updating widget: $e');
    }
  }

  /// Handle amplitude updates with frame rate limiting and validation
  void _onAmplitudeUpdate(double amplitude) {
    if (_isDisposed) return;

    try {
      _totalFrames++;
      final now = DateTime.now();
      
      // Frame rate limiting for performance
      if (now.difference(_lastUpdateTime) < _updateThrottle) {
        _frameDropCount++;
        return;
      }
      
      _lastUpdateTime