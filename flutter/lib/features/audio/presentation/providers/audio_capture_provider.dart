import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:record/record.dart';

/// Estados do áudio
abstract class AudioCaptureState {
  const AudioCaptureState();
}

class Initial extends AudioCaptureState {
  const Initial();
}

class RecordingState extends AudioCaptureState {
  final Duration duration;
  final List<double> waveformData;
  
  const RecordingState({
    required this.duration,
    required this.waveformData,
  });
  
  RecordingState copyWith({
    Duration? duration,
    List<double>? waveformData,
  }) {
    return RecordingState(
      duration: duration ?? this.duration,
      waveformData: waveformData ?? this.waveformData,
    );
  }
}

class CompletedState extends AudioCaptureState {
  final String audioPath;
  final Duration duration;
  final List<double> waveformData;
  
  const CompletedState({
    required this.audioPath,
    required this.duration,
    required this.waveformData,
  });
}

class AnalyzingState extends AudioCaptureState {
  final String audioPath;
  final double progress;
  
  const AnalyzingState({
    required this.audioPath,
    required this.progress,
  });
}

class AnalysisCompletedState extends AudioCaptureState {
  final String audioPath;
  final Map<String, dynamic> analysisResult;
  
  const AnalysisCompletedState({
    required this.audioPath,
    required this.analysisResult,
  });
}

class ErrorState extends AudioCaptureState {
  final String message;
  final String? audioPath;
  
  const ErrorState({
    required this.message,
    this.audioPath,
  });
}

/// Notificador do provider de captura de áudio
class AudioCaptureNotifier extends StateNotifier<AudioCaptureState> {
  final Record _recorder = Record();
  String? _currentRecordingPath;
  DateTime? _recordingStartTime;
  
  AudioCaptureNotifier() : super(const Initial());
  
  /// Inicia a gravação
  Future<void> startRecording() async {
    try {
      if (await _recorder.hasPermission()) {
        final path = '/tmp/audio_${DateTime.now().millisecondsSinceEpoch}.wav';
        await _recorder.start(path: path);
        
        _currentRecordingPath = path;
        _recordingStartTime = DateTime.now();
        
        state = RecordingState(
          duration: Duration.zero,
          waveformData: [],
        );
        
        // Simula atualizações da gravação
        _updateRecordingState();
      } else {
        state = const ErrorState(message: 'Permissão de gravação negada');
      }
    } catch (e) {
      state = ErrorState(message: 'Erro ao iniciar gravação: $e');
    }
  }
  
  /// Para a gravação
  Future<void> stopRecording() async {
    try {
      final path = await _recorder.stop();
      
      if (path != null && _recordingStartTime != null) {
        final duration = DateTime.now().difference(_recordingStartTime!);
        
        state = CompletedState(
          audioPath: path,
          duration: duration,
          waveformData: _generateMockWaveform(),
        );
      } else {
        state = const ErrorState(message: 'Erro ao finalizar gravação');
      }
    } catch (e) {
      state = ErrorState(message: 'Erro ao parar gravação: $e');
    }
  }
  
  /// Analisa o áudio gravado
  Future<void> analyzeAudio() async {
    final currentState = state;
    if (currentState is! CompletedState) return;
    
    try {
      state = AnalyzingState(
        audioPath: currentState.audioPath,
        progress: 0.0,
      );
      
      // Simula progresso da análise
      for (int i = 1; i <= 10; i++) {
        await Future.delayed(const Duration(milliseconds: 300));
        state = AnalyzingState(
          audioPath: currentState.audioPath,
          progress: i / 10,
        );
      }
      
      // Resultado mock da análise
      state = AnalysisCompletedState(
        audioPath: currentState.audioPath,
        analysisResult: {
          'lieDetected': false,
          'confidence': 0.85,
          'emotions': ['calm', 'confident'],
          'stressLevel': 0.2,
          'speechRate': 'normal',
        },
      );
    } catch (e) {
      state = ErrorState(
        message: 'Erro na análise: $e',
        audioPath: currentState.audioPath,
      );
    }
  }
  
  /// Reseta o estado
  void reset() {
    state = const Initial();
    _currentRecordingPath = null;
    _recordingStartTime = null;
  }
  
  /// Atualiza o estado durante a gravação
  void _updateRecordingState() {
    if (state is RecordingState && _recordingStartTime != null) {
      final currentState = state as RecordingState;
      final duration = DateTime.now().difference(_recordingStartTime!);
      
      state = currentState.copyWith(
        duration: duration,
        waveformData: _generateMockWaveform(),
      );
      
      // Continua atualizando se ainda está gravando
      Future.delayed(const Duration(milliseconds: 100), () {
        if (state is RecordingState) {
          _updateRecordingState();
        }
      });
    }
  }
  
  /// Gera dados mock para o waveform
  List<double> _generateMockWaveform() {
    return List.generate(
      50,
      (index) => (0.1 + (0.9 * (index % 10) / 10)) * 
                  (0.5 + 0.5 * (index % 3) / 3),
    );
  }
  
  @override
  void dispose() {
    _recorder.dispose();
    super.dispose();
  }
}

/// Provider principal para captura de áudio
final audioCaptureProvider = StateNotifierProvider<AudioCaptureNotifier, AudioCaptureState>((ref) {
  return AudioCaptureNotifier();
});
