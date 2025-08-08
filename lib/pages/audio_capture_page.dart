import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/theme/app_colors.dart';
import '../providers/audio_capture_provider.dart';
import '../widgets/audio_waveform_widget.dart';
import '../widgets/recording_controls_widget.dart';
import '../widgets/analysis_result_widget.dart';

class AudioCapturePage extends ConsumerStatefulWidget {
  const AudioCapturePage({super.key});

  @override
  ConsumerState<AudioCapturePage> createState() => _AudioCapturePageState();
}

class _AudioCapturePageState extends ConsumerState<AudioCapturePage>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _fadeController;
  
  @override
  void initState() {
    super.initState();
    
    // Animação de pulso para botão de gravação
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    
    // Animação de fade para transições
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    )..forward();
  }
  
  @override
  void dispose() {
    _pulseController.dispose();
    _fadeController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final audioState = ref.watch(audioCaptureProvider);
    
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text(
          'Quem Mente Menos?',
          style: TextStyle(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppColors.surface,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.help_outline),
            color: AppColors.textSecondary,
            onPressed: () => _showHelpDialog(context),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Status indicator
            _buildStatusIndicator(audioState),
            
            // Waveform
            Expanded(
              flex: 2,
              child: Center(
                child: _buildWaveform(audioState),
              ),
            ),
            
            // Analysis result (if available)
            if (audioState is AnalysisCompleteState)
              Expanded(
                flex: 3,
                child: SingleChildScrollView(
                  child: AnalysisResultWidget(result: audioState.result),
                ),
              ),
            
            // Recording controls
            Expanded(
              flex: 1,
              child: const Center(
                child: RecordingControlsWidget(),
              ),
            ),
            
            // Error message
            if (audioState is ErrorState)
              Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.error),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error, color: AppColors.error),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        audioState.message,
                        style: const TextStyle(color: AppColors.error),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildStatusIndicator(AudioCaptureState state) {
    String statusText;
    Color statusColor;
    IconData statusIcon;
    
    if (state is Initial) {
      statusText = 'Toque no microfone para começar';
      statusColor = AppColors.textSecondary;
      statusIcon = Icons.mic_none;
    } else if (state is RecordingState) {
      statusText = 'Gravando...';
      statusColor = AppColors.recording;
      statusIcon = Icons.fiber_manual_record;
    } else if (state is CompletedState) {
      statusText = 'Gravação concluída';
      statusColor = AppColors.success;
      statusIcon = Icons.check_circle;
    } else if (state is AnalyzingState) {
      statusText = 'Analisando... ${(state.progress * 100).toInt()}%';
      statusColor = AppColors.warning;
      statusIcon = Icons.analytics;
    } else if (state is AnalysisCompleteState) {
      statusText = 'Análise concluída';
      statusColor = AppColors.success;
      statusIcon = Icons.check_circle_outline;
    } else if (state is ErrorState) {
      statusText = 'Erro';
      statusColor = AppColors.error;
      statusIcon = Icons.error_outline;
    } else {
      statusText = 'Status desconhecido';
      statusColor = AppColors.textSecondary;
      statusIcon = Icons.help_outline;
    }
    
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            statusIcon,
            color: statusColor,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            statusText,
            style: TextStyle(
              color: statusColor,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildWaveform(AudioCaptureState state) {
    List<double> waveformData = [];
    bool isRecording = false;
    
    if (state is RecordingState) {
      waveformData = state.waveformData;
      isRecording = true;
    } else if (state is CompletedState) {
      waveformData = state.waveformData;
    } else if (state is AnalysisCompleteState) {
      // Pode mostrar waveform salvo se necessário
      waveformData = [];
    }
    
    return AnimatedBuilder(
      animation: _fadeController,
      builder: (context, child) {
        return Opacity(
          opacity: _fadeController.value,
          child: AudioWaveformWidget(
            waveform: waveformData,
            isRecording: isRecording,
            height: 200,
          ),
        );
      },
    );
  }
  
  void _showHelpDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Como usar'),
        content: const Text(
          '1. Toque no microfone para começar a gravar\n\n'
          '2. Fale naturalmente por alguns segundos\n\n'
          '3. Toque no botão para parar a gravação\n\n'
          '4. Aguarde a análise da IA\n\n'
          '5. Veja o resultado da detecção de mentiras',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Entendi'),
          ),
        ],
      ),
    );
  }
}
