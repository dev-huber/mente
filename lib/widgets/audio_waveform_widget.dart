import 'package:flutter/material.dart';
import 'dart:math' as math;

/// Defensive waveform visualization widget with performance optimization
class AudioWaveformWidget extends StatefulWidget {
  final Stream<double> amplitudeStream;
  final bool isRecording;
  final Duration duration;
  final Color waveColor;
  final Color backgroundColor;
  final double height;
  final int maxBars;

  const AudioWaveformWidget({
    Key? key,
    required this.amplitudeStream,
    required this.isRecording,
    required this.duration,
    this.waveColor = Colors.blue,
    this.backgroundColor = Colors.transparent,
    this.height = 100.0,
    this.maxBars = 50,
  }) : super(key: key);

  @override
  State<AudioWaveformWidget> createState() => _AudioWaveformWidgetState();
}

class _AudioWaveformWidgetState extends State<AudioWaveformWidget>
    with TickerProviderStateMixin {
  
  late AnimationController _animationController;
  late Animation<double> _animation;
  
  final List<double> _amplitudeHistory = [];
  double _currentAmplitude = 0.0;
  
  // Performance optimization: throttle updates
  DateTime _lastUpdateTime = DateTime.now();
  static const Duration _updateThrottle = Duration(milliseconds: 50);

  @override
  void initState() {
    super.initState();
    
    // Initialize animation controller for smooth transitions
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    
    _animation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));

    // Start animation when recording
    if (widget.isRecording) {
      _animationController.repeat(reverse: true);
    }

    // Listen to amplitude stream with error handling
    widget.amplitudeStream.listen(
      _onAmplitudeUpdate,
      onError: _onAmplitudeError,
    );
  }

  @override
  void didUpdateWidget(AudioWaveformWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    // Handle recording state changes
    if (widget.isRecording != oldWidget.isRecording) {
      if (widget.isRecording) {
        _animationController.repeat(reverse: true);
      } else {
        _animationController.stop();
        _animationController.reset();
      }
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  /// Handle amplitude updates with throttling for performance
  void _onAmplitudeUpdate(double amplitude) {
    try {
      final now = DateTime.now();
      
      // Throttle updates to prevent excessive rebuilds
      if (now.difference(_lastUpdateTime) < _updateThrottle) {
        return;
      }
      
      _lastUpdateTime = now;

      // Validate amplitude value
      final validAmplitude = amplitude.isNaN || amplitude.isInfinite 
          ? 0.0 
          : amplitude.clamp(0.0, 1.0);

      // Add to history and maintain max size
      _amplitudeHistory.add(validAmplitude);
      if (_amplitudeHistory.length > widget.maxBars) {
        _amplitudeHistory.removeAt(0);
      }

      // Update current amplitude
      if (mounted) {
        setState(() {
          _currentAmplitude = validAmplitude;
        });
      }
      
    } catch (e) {
      debugPrint('Error updating amplitude: $e');
    }
  }

  /// Handle amplitude stream errors
  void _onAmplitudeError(Object error) {
    debugPrint('Amplitude stream error: $error');
    
    // Graceful degradation: show static bars
    if (mounted) {
      setState(() {
        _currentAmplitude = 0.0;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      decoration: BoxDecoration(
        color: widget.backgroundColor,
        borderRadius: BorderRadius.circular(8.0),
        border: Border.all(
          color: Colors.grey.withOpacity(0.3),
          width: 1.0,
        ),
      ),
      child: widget.isRecording 
          ? _buildActiveWaveform()
          : _buildInactiveWaveform(),
    );
  }

  /// Build active waveform visualization
  Widget _buildActiveWaveform() {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return CustomPaint(
          painter: WaveformPainter(
            amplitudeHistory: _amplitudeHistory,
            currentAmplitude: _currentAmplitude,
            waveColor: widget.waveColor,
            animationValue: _animation.value,
            isRecording: true,
          ),
          size: Size.infinite,
        );
      },
    );
  }

  /// Build inactive waveform (when not recording)
  Widget _buildInactiveWaveform() {
    return CustomPaint(
      painter: WaveformPainter(
        amplitudeHistory: _amplitudeHistory,
        currentAmplitude: 0.0,
        waveColor: widget.waveColor.withOpacity(0.3),
        animationValue: 0.0,
        isRecording: false,
      ),
      size: Size.infinite,
    );
  }
}

/// Custom painter for waveform visualization with performance optimization
class WaveformPainter extends CustomPainter {
  final List<double> amplitudeHistory;
  final double currentAmplitude;
  final Color waveColor;
  final double animationValue;
  final bool isRecording;

  WaveformPainter({
    required this.amplitudeHistory,
    required this.currentAmplitude,
    required this.waveColor,
    required this.animationValue,
    required this.isRecording,
  });

  @override
  void paint(Canvas canvas, Size size) {
    try {
      final paint = Paint()
        ..color = waveColor
        ..style = PaintingStyle.fill;

      // Calculate bar dimensions
      final barWidth = size.width / math.max(amplitudeHistory.length, 1);
      final centerY = size.height / 2;
      final maxBarHeight = size.height * 0.8;

      // Draw amplitude history bars
      for (int i = 0; i < amplitudeHistory.length; i++) {
        final amplitude = amplitudeHistory[i];
        final x = i * barWidth;
        
        // Calculate bar height with animation
        double barHeight = amplitude * maxBarHeight;
        
        if (isRecording) {
          // Add subtle animation to active bars
          barHeight *= (0.8 + 0.2 * (1 + math.sin(animationValue * math.pi * 2)));
        }

        // Ensure minimum visible bar height
        barHeight = math.max(barHeight, 2.0);

        // Draw bar with rounded corners
        final rect = RRect.fromRectAndRadius(
          Rect.fromLTWH(
            x + barWidth * 0.1,
            centerY - barHeight / 2,
            barWidth * 0.8,
            barHeight,
          ),
          const Radius.circular(2.0),
        );

        canvas.drawRRect(rect, paint);
      }

      // Draw current amplitude indicator if recording
      if (isRecording && currentAmplitude > 0) {
        _drawCurrentAmplitudeIndicator(canvas, size, paint);
      }

    } catch (e) {
      debugPrint('Error painting waveform: $e');
    }
  }

  /// Draw current amplitude indicator
  void _drawCurrentAmplitudeIndicator(Canvas canvas, Size size, Paint paint) {
    final centerY = size.height / 2;
    final maxBarHeight = size.height * 0.8;
    final indicatorHeight = currentAmplitude * maxBarHeight;
    
    // Highlight paint for current amplitude
    final highlightPaint = Paint()
      ..color = waveColor.withOpacity(0.7)
      ..style = PaintingStyle.fill;

    // Draw current amplitude bar at the right edge
    final rect = RRect.fromRectAndRadius(
      Rect.fromLTWH(
        size.width - 6,
        centerY - indicatorHeight / 2,
        4.0,
        math.max(indicatorHeight, 2.0),
      ),
      const Radius.circular(2.0),
    );

    canvas.drawRRect(rect, highlightPaint);
  }

  @override
  bool shouldRepaint(covariant WaveformPainter oldDelegate) {
    return oldDelegate.amplitudeHistory.length != amplitudeHistory.length ||
           oldDelegate.currentAmplitude != currentAmplitude ||
           oldDelegate.animationValue != animationValue ||
           oldDelegate.isRecording != isRecording;
  }
}

/// Fallback waveform widget for when main visualization fails
class FallbackWaveformWidget extends StatelessWidget {
  final bool isRecording;
  final Color color;
  final double height;

  const FallbackWaveformWidget({
    Key? key,
    required this.isRecording,
    required this.color,
    required this.height,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Colors.grey.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.0),
        border: Border.all(
          color: Colors.grey.withOpacity(0.3),
          width: 1.0,
        ),
      ),
      child: Center(
        child: isRecording 
            ? Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.mic,
                    color: color,
                    size: 24.0,
                  ),
                  const SizedBox(width: 8.0),
                  Text(
                    'Recording...',
                    style: TextStyle(
                      color: color,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              )
            : Icon(
                Icons.mic_off,
                color: Colors.grey,
                size: 24.0,
              ),
      ),
    );
  }
}
