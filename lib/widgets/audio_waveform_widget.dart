import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../core/theme/app_colors.dart';

class AudioWaveformWidget extends StatefulWidget {
  final List<double> waveform;
  final bool isRecording;
  final Color? color;
  final double height;
  
  const AudioWaveformWidget({
    super.key,
    required this.waveform,
    this.isRecording = false,
    this.color,
    this.height = 200,
  });
  
  @override
  State<AudioWaveformWidget> createState() => _AudioWaveformWidgetState();
}

class _AudioWaveformWidgetState extends State<AudioWaveformWidget>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );
    
    if (widget.isRecording) {
      _animationController.repeat(reverse: true);
    }
  }
  
  @override
  void didUpdateWidget(AudioWaveformWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.isRecording != oldWidget.isRecording) {
      if (widget.isRecording) {
        _animationController.repeat(reverse: true);
      } else {
        _animationController.stop();
      }
    }
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: widget.height,
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: CustomPaint(
        painter: WaveformPainter(
          waveform: widget.waveform,
          color: widget.color ?? AppColors.waveformActive,
          isRecording: widget.isRecording,
          animationValue: _animationController.value,
        ),
      ),
    );
  }
}

class WaveformPainter extends CustomPainter {
  final List<double> waveform;
  final Color color;
  final bool isRecording;
  final double animationValue;
  
  WaveformPainter({
    required this.waveform,
    required this.color,
    required this.isRecording,
    required this.animationValue,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    if (waveform.isEmpty) {
      _drawEmptyWaveform(canvas, size);
      return;
    }
    
    final paint = Paint()
      ..color = color.withOpacity(isRecording ? 0.8 + (animationValue * 0.2) : 1.0)
      ..style = PaintingStyle.fill;
    
    final barWidth = size.width / waveform.length;
    final centerY = size.height / 2;
    
    for (int i = 0; i < waveform.length; i++) {
      final amplitude = waveform[i];
      final barHeight = amplitude * size.height * 0.8;
      
      final rect = Rect.fromLTWH(
        i * barWidth,
        centerY - (barHeight / 2),
        barWidth * 0.8,
        barHeight,
      );
      
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(2)),
        paint,
      );
    }
  }
  
  void _drawEmptyWaveform(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppColors.waveformInactive
      ..style = PaintingStyle.fill;
    
    final barCount = 50;
    final barWidth = size.width / barCount;
    final centerY = size.height / 2;
    
    for (int i = 0; i < barCount; i++) {
      final amplitude = math.sin(i * 0.2) * 0.3 + 0.1;
      final barHeight = amplitude * size.height * 0.6;
      
      final rect = Rect.fromLTWH(
        i * barWidth,
        centerY - (barHeight / 2),
        barWidth * 0.8,
        barHeight,
      );
      
      canvas.drawRRect(
        RRect.fromRectAndRadius(rect, const Radius.circular(2)),
        paint,
      );
    }
  }
  
  @override
  bool shouldRepaint(WaveformPainter oldDelegate) {
    return oldDelegate.waveform != waveform ||
           oldDelegate.color != color ||
           oldDelegate.isRecording != isRecording ||
           oldDelegate.animationValue != animationValue;
  }
}
