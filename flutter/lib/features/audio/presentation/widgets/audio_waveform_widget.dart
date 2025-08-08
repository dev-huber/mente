import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:quem_mente_menos/core/theme/app_colors.dart';

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
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    
    if (widget.isRecording) {
      _animationController.repeat();
    }
  }
  
  @override
  void didUpdateWidget(AudioWaveformWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isRecording != oldWidget.isRecording) {
      if (widget.isRecording) {
        _animationController.repeat();
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
      child: CustomPaint(
        painter: WaveformPainter(
          waveform: widget.waveform,
          color: widget.color ?? AppColors.primary,
          isAnimating: widget.isRecording,
          animationValue: _animationController,
        ),
        size: Size.infinite,
      ),
    );
  }
}

class WaveformPainter extends CustomPainter {
  final List<double> waveform;
  final Color color;
  final bool isAnimating;
  final Animation<double>? animationValue;
  
  WaveformPainter({
    required this.waveform,
    required this.color,
    this.isAnimating = false,
    this.animationValue,
  }) : super(repaint: animationValue);
  
  @override
  void paint(Canvas canvas, Size size) {
    if (waveform.isEmpty) {
      _drawEmptyState(canvas, size);
      return;
    }
    
    final paint = Paint()
      ..color = color
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round
      ..style = PaintingStyle.stroke;
    
    final path = Path();
    final width = size.width;
    final height = size.height;
    final centerY = height / 2;
    
    // Normalizar e suavizar waveform
    final normalizedWaveform = _normalizeWaveform(waveform, width.toInt());
    
    // Desenhar waveform
    for (int i = 0; i < normalizedWaveform.length; i++) {
      final x = (i / normalizedWaveform.length) * width;
      final amplitude = normalizedWaveform[i];
      
      // Aplicar animação se gravando
      final animatedAmplitude = isAnimating && animationValue != null
          ? amplitude * (0.8 + 0.2 * math.sin(animationValue!.value * 2 * math.pi + i * 0.1))
          : amplitude;
      
      final y = centerY + (animatedAmplitude * height * 0.4);
      
      if (i == 0) {
        path.moveTo(x, centerY);
      }
      
      // Criar curva suave
      final prevX = i > 0 ? ((i - 1) / normalizedWaveform.length) * width : x;
      final controlX = (prevX + x) / 2;
      
      path.quadraticBezierTo(
        controlX,
        y,
        x,
        centerY - (animatedAmplitude * height * 0.4),
      );
    }
    
    // Desenhar linha central
    final centerLinePaint = Paint()
      ..color = color.withOpacity(0.2)
      ..strokeWidth = 1.0;
    
    canvas.drawLine(
      Offset(0, centerY),
      Offset(width, centerY),
      centerLinePaint,
    );
    
    // Desenhar waveform
    canvas.drawPath(path, paint);
    
    // Adicionar glow effect se gravando
    if (isAnimating) {
      final glowPaint = Paint()
        ..color = color.withOpacity(0.3)
        ..strokeWidth = 6.0
        ..strokeCap = StrokeCap.round
        ..style = PaintingStyle.stroke
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3);
      
      canvas.drawPath(path, glowPaint);
    }
  }
  
  void _drawEmptyState(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color.withOpacity(0.3)
      ..strokeWidth = 2.0;
    
    final centerY = size.height / 2;
    const dashWidth = 5.0;
    const dashSpace = 5.0;
    
    // Desenhar linha tracejada
    for (double x = 0; x < size.width; x += dashWidth + dashSpace) {
      canvas.drawLine(
        Offset(x, centerY),
        Offset(math.min(x + dashWidth, size.width), centerY),
        paint,
      );
    }
  }
  
  List<double> _normalizeWaveform(List<double> data, int targetLength) {
    if (data.length == targetLength) return data;
    
    final normalized = <double>[];
    final ratio = data.length / targetLength;
    
    for (int i = 0; i < targetLength; i++) {
      final index = (i * ratio).floor();
      if (index < data.length) {
        // Aplicar suavização
        final value = data[index];
        final smoothed = _applySmoothingFilter(data, index);
        normalized.add((value + smoothed) / 2);
      } else {
        normalized.add(0);
      }
    }
    
    return normalized;
  }
  
  double _applySmoothingFilter(List<double> data, int index) {
    const windowSize = 3;
    double sum = 0;
    int count = 0;
    
    for (int i = -windowSize; i <= windowSize; i++) {
      final idx = index + i;
      if (idx >= 0 && idx < data.length) {
        sum += data[idx];
        count++;
      }
    }
    
    return count > 0 ? sum / count : data[index];
  }
  
  @override
  bool shouldRepaint(WaveformPainter oldDelegate) {
    return oldDelegate.waveform != waveform ||
           oldDelegate.isAnimating != isAnimating ||
           oldDelegate.color != color;
  }
}
