import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mentira_app/core/theme/app_colors.dart';
import 'package:mentira_app/features/audio/presentation/providers/audio_capture_provider.dart';
import 'package:mentira_app/features/audio/presentation/widgets/audio_waveform_widget.dart';
import 'package:mentira_app/features/audio/presentation/widgets/recording_controls_widget.dart';
import 'package:mentira_app/features/audio/presentation/widgets/analysis_result_widget.dart';

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
      body: SafeArea(
        child: audioState.when(
          data: (state) => _buildContent(state),
          loading: () => _buildLoading(),
          error: (error, stack) => _buildError(error),
        ),
      ),
    );
  }
  
  Widget _buildContent(AudioCaptureState state) {
    return Column(
      children: [
        // Header
        _buildHeader(),
        
        // Main content area
        Expanded(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 500),
            child: state.map(
              initial: (_) => _buildInitialState(),
              recording: (recordingState) => _buildRecordingState(recordingState),
              processing: (_) => _buildProcessingState(),
              completed: (completedState) => _buildCompletedState(completedState),
              error: (errorState) => _buildErrorState(errorState),
            ),
          ),
        ),
        
        // Controls
        _buildControls(state),
      ],
    );
  }
  
  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Text(
            'Quem Mente Menos?',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Grave seu áudio e descubra a verdade',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildInitialState() {
    return Center(
      child: FadeTransition(
        opacity: _fadeController,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.mic_none,
              size: 120,
              color: AppColors.primary.withOpacity(0.5),
            ),
            const SizedBox(height: 24),
            Text(
              'Toque para começar a gravar',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text(
              'Fale naturalmente e seja honesto',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildRecordingState(RecordingState state) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Timer
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
          decoration: BoxDecoration(
            color: AppColors.error.withOpacity(0.1),
            borderRadius: BorderRadius.circular(30),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.fiber_manual_record,
                color: AppColors.error,
                size: 16,
              ),
              const SizedBox(width: 8),
              Text(
                _formatDuration(state.duration),
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 40),
        
        // Waveform
        Container(
          height: 200,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: AudioWaveformWidget(
            waveform: state.waveform,
            isRecording: true,
          ),
        ),
        
        const SizedBox(height: 40),
        
        // Instructions
        Text(
          'Gravando...',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: AppColors.error,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Toque para parar quando terminar',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
  
  Widget _buildProcessingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            strokeWidth: 3,
          ),
          const SizedBox(height: 24),
          Text(
            'Analisando seu áudio...',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          Text(
            'Isso pode levar alguns segundos',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildCompletedState(CompletedState state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: AnalysisResultWidget(
        result: state.analysisResult,
        onNewRecording: () {
          ref.read(audioCaptureProvider.notifier).reset();
        },
      ),
    );
  }
  
  Widget _buildErrorState(ErrorState state) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 80,
              color: AppColors.error,
            ),
            const SizedBox(height: 24),
            Text(
              'Ops! Algo deu errado',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text(
              state.message,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                ref.read(audioCaptureProvider.notifier).reset();
              },
              child: const Text('Tentar Novamente'),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildControls(AudioCaptureState state) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: RecordingControlsWidget(
        state: state,
        pulseAnimation: _pulseController,
        onRecordPressed: () {
          if (state is Initial) {
            ref.read(audioCaptureProvider.notifier).startRecording();
          } else if (state is RecordingState) {
            ref.read(audioCaptureProvider.notifier).stopRecording();
          }
        },
      ),
    );
  }
  
  Widget _buildLoading() {
    return const Center(
      child: CircularProgressIndicator(),
    );
  }
  
  Widget _buildError(Object error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error,
              size: 64,
              color: AppColors.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Erro ao inicializar',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
  
  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }
}
