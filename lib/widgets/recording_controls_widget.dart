import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../core/theme/app_colors.dart';
import '../providers/audio_capture_provider.dart';

class RecordingControlsWidget extends ConsumerWidget {
  const RecordingControlsWidget({super.key});
  
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final audioState = ref.watch(audioCaptureProvider);
    final audioNotifier = ref.read(audioCaptureProvider.notifier);
    
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Duration display
        if (audioState is RecordingState)
          Padding(
            padding: const EdgeInsets.only(bottom: 32),
            child: Text(
              _formatDuration(audioState.duration),
              style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        
        // Recording button
        GestureDetector(
          onTap: () => _handleRecordingTap(audioState, audioNotifier),
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: _getButtonGradient(audioState),
              boxShadow: [
                BoxShadow(
                  color: _getButtonColor(audioState).withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 5,
                ),
              ],
            ),
            child: Center(
              child: Icon(
                _getButtonIcon(audioState),
                size: 48,
                color: Colors.white,
              ),
            ),
          ),
        ),
        
        const SizedBox(height: 24),
        
        // Action buttons
        _buildActionButtons(context, audioState, audioNotifier),
      ],
    );
  }
  
  void _handleRecordingTap(AudioCaptureState state, AudioCaptureNotifier notifier) {
    if (state is Initial) {
      notifier.startRecording();
    } else if (state is RecordingState) {
      notifier.stopRecording();
    } else if (state is CompletedState) {
      notifier.analyzeAudio(state.audioPath);
    } else if (state is AnalysisCompleteState) {
      notifier.reset();
    } else if (state is ErrorState) {
      notifier.reset();
    }
  }
  
  IconData _getButtonIcon(AudioCaptureState state) {
    if (state is Initial) return Icons.mic;
    if (state is RecordingState) return Icons.stop;
    if (state is CompletedState) return Icons.analytics;
    if (state is AnalyzingState) return Icons.hourglass_bottom;
    if (state is AnalysisCompleteState) return Icons.refresh;
    if (state is ErrorState) return Icons.refresh;
    return Icons.mic;
  }
  
  Color _getButtonColor(AudioCaptureState state) {
    if (state is RecordingState) return AppColors.recording;
    if (state is CompletedState) return AppColors.analysisBlue;
    if (state is AnalyzingState) return AppColors.warning;
    if (state is AnalysisCompleteState) return AppColors.success;
    if (state is ErrorState) return AppColors.error;
    return AppColors.primary;
  }
  
  Gradient _getButtonGradient(AudioCaptureState state) {
    if (state is RecordingState) return AppColors.recordingGradient;
    return AppColors.primaryGradient;
  }
  
  Widget _buildActionButtons(BuildContext context, AudioCaptureState state, AudioCaptureNotifier notifier) {
    if (state is CompletedState) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildActionButton(
            icon: Icons.refresh,
            label: 'Nova Gravação',
            onTap: notifier.reset,
          ),
          _buildActionButton(
            icon: Icons.analytics,
            label: 'Analisar',
            onTap: () => notifier.analyzeAudio(state.audioPath),
          ),
        ],
      );
    }
    
    if (state is AnalysisCompleteState) {
      return Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildActionButton(
            icon: Icons.refresh,
            label: 'Nova Análise',
            onTap: notifier.reset,
          ),
          _buildActionButton(
            icon: Icons.share,
            label: 'Compartilhar',
            onTap: () => _shareResult(state.result),
          ),
        ],
      );
    }
    
    if (state is ErrorState) {
      return _buildActionButton(
        icon: Icons.refresh,
        label: 'Tentar Novamente',
        onTap: notifier.reset,
      );
    }
    
    return const SizedBox.shrink();
  }
  
  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Icon(
              icon,
              size: 24,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
  
  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }
  
  void _shareResult(AnalysisResult result) {
    // Implementar compartilhamento
    // Share.share('Resultado da análise: ${result.confidence}');
  }
}
