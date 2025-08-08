import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mentira_app/core/theme/app_colors.dart';
import 'package:mentira_app/features/audio/presentation/providers/audio_capture_provider.dart';

/// Widget para controles de gravação
class RecordingControlsWidget extends ConsumerWidget {
  const RecordingControlsWidget({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final audioState = ref.watch(audioCaptureProvider);
    final audioNotifier = ref.read(audioCaptureProvider.notifier);

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Botão principal de gravação
        GestureDetector(
          onTap: () {
            if (audioState is RecordingState) {
              audioNotifier.stopRecording();
            } else if (audioState is Initial || audioState is ErrorState) {
              audioNotifier.startRecording();
            }
          },
          child: Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: audioState is RecordingState
                  ? AppColors.recordingGradient
                  : AppColors.primaryGradient,
              boxShadow: [
                BoxShadow(
                  color: (audioState is RecordingState
                          ? AppColors.recording
                          : AppColors.primary)
                      .withOpacity(0.3),
                  blurRadius: 20,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Icon(
              audioState is RecordingState ? Icons.stop : Icons.mic,
              size: 48,
              color: Colors.white,
            ),
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Texto de status
        Text(
          _getStatusText(audioState),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary,
          ),
        ),
        
        const SizedBox(height: 8),
        
        // Duração da gravação
        if (audioState is RecordingState)
          Text(
            _formatDuration(audioState.duration),
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.recording,
            ),
          ),
        
        const SizedBox(height: 24),
        
        // Botões secundários
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            // Botão de reset
            if (audioState is CompletedState || audioState is ErrorState)
              IconButton(
                onPressed: () => audioNotifier.reset(),
                icon: const Icon(Icons.refresh),
                iconSize: 32,
                color: AppColors.textSecondary,
              ),
            
            // Botão de análise
            if (audioState is CompletedState)
              ElevatedButton.icon(
                onPressed: () => audioNotifier.analyzeAudio(),
                icon: const Icon(Icons.psychology),
                label: const Text('Analisar'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.analysisBlue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  String _getStatusText(AudioCaptureState state) {
    return switch (state) {
      Initial() => 'Pressione para gravar',
      RecordingState() => 'Gravando...',
      CompletedState() => 'Gravação concluída',
      AnalyzingState() => 'Analisando...',
      AnalysisCompletedState() => 'Análise concluída',
      ErrorState() => 'Erro: ${state.message}',
    };
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }
}
