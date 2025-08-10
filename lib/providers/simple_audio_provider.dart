import 'package:flutter_riverpod/flutter_riverpod.dart';

// Estado simples do áudio
enum AudioState {
  idle,
  recording,
  paused,
  stopped,
  uploading,
  error
}

class AudioCaptureState {
  final AudioState state;
  final Duration duration;
  final String? errorMessage;
  final bool isProcessing;

  const AudioCaptureState({
    this.state = AudioState.idle,
    this.duration = Duration.zero,
    this.errorMessage,
    this.isProcessing = false,
  });

  AudioCaptureState copyWith({
    AudioState? state,
    Duration? duration,
    String? errorMessage,
    bool? isProcessing,
  }) {
    return AudioCaptureState(
      state: state ?? this.state,
      duration: duration ?? this.duration,
      errorMessage: errorMessage,
      isProcessing: isProcessing ?? this.isProcessing,
    );
  }
}

// Provider simples para teste
final audioProvider = StateNotifierProvider<AudioNotifier, AudioCaptureState>((ref) {
  return AudioNotifier();
});

class AudioNotifier extends StateNotifier<AudioCaptureState> {
  AudioNotifier() : super(const AudioCaptureState());

  void startRecording() {
    state = state.copyWith(state: AudioState.recording);
  }

  void stopRecording() {
    state = state.copyWith(state: AudioState.stopped);
  }

  void pauseRecording() {
    state = state.copyWith(state: AudioState.paused);
  }

  void resumeRecording() {
    state = state.copyWith(state: AudioState.recording);
  }

  void setError(String message) {
    state = state.copyWith(state: AudioState.error, errorMessage: message);
  }

  void clearError() {
    state = state.copyWith(state: AudioState.idle, errorMessage: null);
  }
}
