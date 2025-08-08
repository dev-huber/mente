import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:record/record.dart';
import 'dart:async';
import 'dart:io';
import 'dart:math';

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

class AnalysisCompleteState extends AudioCaptureState {
  final AnalysisResult result;
  final String audioPath;
  
  const AnalysisCompleteState({
    required this.result,
    required this.audioPath,
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

/// Resultado da análise
class AnalysisResult {
  final double lieDetectionScore;
  final String confidence;
  final Map<String, dynamic> details;
  final DateTime timestamp;
  
  const AnalysisResult({
    required this.lieDetectionScore,
    required this.confidence,
    required this.details,
    required this.timestamp,
  });
  
  factory AnalysisResult.fromJson(Map<String, dynamic> json) {
    return AnalysisResult(
      lieDetectionScore: (json['lieDetectionScore'] ?? 0.0).toDouble(),
      confidence: json['confidence'] ?? 'low',
      details: json['details'] ?? {},
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'lieDetectionScore': lieDetectionScore,
      'confidence': confidence,
      'details': details,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

/// Provider para captura e análise de áudio
class AudioCaptureNotifier extends StateNotifier<AudioCaptureState> {
  final AudioRecorder _recorder = AudioRecorder();
  Timer? _recordingTimer;
  Timer? _waveformTimer;
  Duration _currentDuration = Duration.zero;
  List<double> _waveformData = [];
  
  AudioCaptureNotifier() : super(const Initial());
  
  /// Inicia a gravação
  Future<void> startRecording() async {
    try {
      if (await _recorder.hasPermission()) {
        final tempDir = Directory.systemTemp;
        final audioPath = '${tempDir.path}/recording_${DateTime.now().millisecondsSinceEpoch}.m4a';
        
        await _recorder.start(
          const RecordConfig(
            encoder: AudioEncoder.aacLc,
            bitRate: 128000,
            sampleRate: 44100,
          ),
          path: audioPath,
        );
        
        _currentDuration = Duration.zero;
        _waveformData = [];
        
        _startRecordingTimer();
        _startWaveformSimulation();
        
        state = RecordingState(
          duration: _currentDuration,
          waveformData: _waveformData,
        );
      } else {
        state = const ErrorState(message: 'Permissão de microfone negada');
      }
    } catch (e) {
      state = ErrorState(message: 'Erro ao iniciar gravação: $e');
    }
  }
  
  /// Para a gravação
  Future<void> stopRecording() async {
    try {
      _recordingTimer?.cancel();
      _waveformTimer?.cancel();
      
      final audioPath = await _recorder.stop();
      
      if (audioPath != null) {
        state = CompletedState(
          audioPath: audioPath,
          duration: _currentDuration,
          waveformData: List.from(_waveformData),
        );
      } else {
        state = const ErrorState(message: 'Falha ao salvar gravação');
      }
    } catch (e) {
      state = ErrorState(message: 'Erro ao parar gravação: $e');
    }
  }
  
  /// Analisa o áudio gravado
  Future<void> analyzeAudio(String audioPath) async {
    try {
      state = AnalyzingState(audioPath: audioPath, progress: 0.0);
      
      // Simular progresso de análise
      for (int i = 0; i <= 100; i += 10) {
        await Future.delayed(const Duration(milliseconds: 300));
        state = AnalyzingState(audioPath: audioPath, progress: i / 100);
      }
      
      // Simular resultado de análise
      final result = AnalysisResult(
        lieDetectionScore: Random().nextDouble(),
        confidence: ['high', 'medium', 'low'][Random().nextInt(3)],
        details: {
          'speechRate': Random().nextDouble() * 200 + 100,
          'pauseDuration': Random().nextDouble() * 2,
          'voiceTremor': Random().nextBool(),
          'stressLevel': Random().nextDouble(),
        },
        timestamp: DateTime.now(),
      );
      
      state = AnalysisCompleteState(result: result, audioPath: audioPath);
    } catch (e) {
      state = ErrorState(message: 'Erro na análise: $e', audioPath: audioPath);
    }
  }
  
  /// Reseta o estado
  void reset() {
    _recordingTimer?.cancel();
    _waveformTimer?.cancel();
    _currentDuration = Duration.zero;
    _waveformData = [];
    state = const Initial();
  }
  
  void _startRecordingTimer() {
    _recordingTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _currentDuration = Duration(seconds: timer.tick);
      
      if (state is RecordingState) {
        state = (state as RecordingState).copyWith(duration: _currentDuration);
      }
    });
  }
  
  void _startWaveformSimulation() {
    _waveformTimer = Timer.periodic(const Duration(milliseconds: 100), (timer) {
      final amplitude = Random().nextDouble() * 0.8 + 0.1;
      _waveformData.add(amplitude);
      
      // Manter apenas os últimos 100 pontos
      if (_waveformData.length > 100) {
        _waveformData.removeAt(0);
      }
      
      if (state is RecordingState) {
        state = (state as RecordingState).copyWith(waveformData: List.from(_waveformData));
      }
    });
  }
  
  @override
  void dispose() {
    _recordingTimer?.cancel();
    _waveformTimer?.cancel();
    _recorder.dispose();
    super.dispose();
  }
}

/// Provider global para captura de áudio
final audioCaptureProvider = StateNotifierProvider<AudioCaptureNotifier, AudioCaptureState>(
  (ref) => AudioCaptureNotifier(),
);
  Duration get recordingDuration => _recordingDuration;
  bool get isRecording => _recorderService.isRecording;
  bool get isPaused => _recorderService.isPaused;
  bool get isProcessing => _isProcessing;
  bool get isUploading => _isUploading;
  bool get hasError => _errorMessage != null;
  String? get errorMessage => _errorMessage;
  AudioUploadResult<UploadResponse>? get lastUploadResult => _lastUploadResult;
  Stream<double> get amplitudeStream => _amplitudeController.stream;

  /// Initialize the provider and audio services
  Future<void> initialize() async {
    try {
      debugPrint('Initializing AudioCaptureProvider');
      
      _setProcessing(true);
      _clearError();

      // Initialize upload service
      _uploadService.initialize();

      // Initialize recorder service
      final result = await _recorderService.initialize();
      
      if (result.success) {
        // Set up stream subscriptions
        _setupStreamSubscriptions();
        
        _setState(AudioRecordingState.initialized);
        debugPrint('AudioCaptureProvider initialized successfully');
      } else {
        _setError('Failed to initialize: ${result.error?.message}');
        _setState(AudioRecordingState.error);
      }

    } catch (e, stackTrace) {
      debugPrint('Error initializing AudioCaptureProvider: $e');
      debugPrint('Stack trace: $stackTrace');
      _setError('Initialization error: ${e.toString()}');
      _setState(AudioRecordingState.error);
    } finally {
      _setProcessing(false);
    }
  }

  /// Set up stream subscriptions for reactive updates
  void _setupStreamSubscriptions() {
    try {
      // State changes
      _stateSubscription = _recorderService.stateStream.listen(
        _onStateChanged,
        onError: _onStreamError,
      );

      // Duration updates
      _durationSubscription = _recorderService.durationStream.listen(
        _onDurationChanged,
        onError: _onStreamError,
      );

      // Amplitude updates for waveform
      _amplitudeSubscription = _recorderService.amplitudeStream.listen(
        _onAmplitudeChanged,
        onError: _onStreamError,
      );

    } catch (e) {
      debugPrint('Error setting up stream subscriptions: $e');
    }
  }

  /// Handle state changes from recorder service
  void _onStateChanged(AudioRecordingState newState) {
    try {
      _setState(newState);
    } catch (e) {
      debugPrint('Error handling state change: $e');
    }
  }

  /// Handle duration changes
  void _onDurationChanged(Duration duration) {
    try {
      _recordingDuration = duration;
      notifyListeners();
    } catch (e) {
      debugPrint('Error handling duration change: $e');
    }
  }

  /// Handle amplitude changes for waveform
  void _onAmplitudeChanged(double amplitude) {
    try {
      _amplitudeController.add(amplitude);
    } catch (e) {
      debugPrint('Error handling amplitude change: $e');
    }
  }

  /// Handle stream errors
  void _onStreamError(Object error) {
    debugPrint('Stream error: $error');
    _setError('Stream error: ${error.toString()}');
  }

  /// Start recording with comprehensive error handling
  Future<void> startRecording() async {
    try {
      debugPrint('Starting recording');
      
      _setProcessing(true);
      _clearError();
      _clearUploadResult();

      final result = await _recorderService.startRecording();
      
      if (result.success) {
        debugPrint('Recording started successfully');
      } else {
        _setError('Failed to start recording: ${result.error?.message}');
      }

    } catch (e, stackTrace) {
      debugPrint('Error starting recording: $e');
      debugPrint('Stack trace: $stackTrace');
      _setError('Start recording error: ${e.toString()}');
    } finally {
      _setProcessing(false);
    }
  }

  /// Pause recording
  Future<void> pauseRecording() async {
    try {
      debugPrint('Pausing recording');
      
      _setProcessing(true);
      _clearError();

      final result = await _recorderService.pauseRecording();
      
      if (result.success) {
        debugPrint('Recording paused successfully');
      } else {
        _setError('Failed to pause recording: ${result.error?.message}');
      }

    } catch (e, stackTrace) {
      debugPrint('Error pausing recording: $e');
      debugPrint('Stack trace: $stackTrace');
      _setError('Pause recording error: ${e.toString()}');
    } finally {
      _setProcessing(false);
    }
  }

  /// Resume recording
  Future<void> resumeRecording() async {
    try {
      debugPrint('Resuming recording');
      
      _setProcessing(true);
      _clearError();

      final result = await _recorderService.resumeRecording();
      
      if (result.success) {
        debugPrint('Recording resumed successfully');
      } else {
        _setError('Failed to resume recording: ${result.error?.message}');
      }

    } catch (e, stackTrace) {
      debugPrint('Error resuming recording: $e');
      debugPrint('Stack trace: $stackTrace');
      _setError('Resume recording error: ${e.toString()}');
    } finally {
      _setProcessing(false);
    }
  }

  /// Stop recording and upload
  Future<void> stopRecording() async {
    try {
      debugPrint('Stopping recording');
      
      _setProcessing(true);
      _clearError();

      // Stop recording
      final stopResult = await _recorderService.stopRecording();
      
      if (stopResult.success) {
        debugPrint('Recording stopped successfully: ${stopResult.data}');
        
        // Upload the recorded file
        if (stopResult.data != null) {
          await _uploadRecording(stopResult.data!);
        } else {
          _setError('Recording stopped but no file was created');
        }
      } else {
        _setError('Failed to stop recording: ${stopResult.error?.message}');
      }

    } catch (e, stackTrace) {
      debugPrint('Error stopping recording: $e');
      debugPrint('Stack trace: $stackTrace');
      _setError('Stop recording error: ${e.toString()}');
    } finally {
      _setProcessing(false);
    }
  }

  /// Upload recording to server
  Future<void> _uploadRecording(String filePath) async {
    try {
      debugPrint('Uploading recording: $filePath');
      
      _setUploading(true);

      final uploadResult = await _uploadService.uploadAudio(
        filePath: filePath,
        userId: 'anonymous', // In production, use actual user ID
        metadata: {
          'duration': _recordingDuration.inSeconds,
          'timestamp': DateTime.now().toIso8601String(),
          'app_version': '1.0.0',
        },
      );

      _setUploadResult(uploadResult);

      if (uploadResult.success) {
        debugPrint('Upload completed successfully: ${uploadResult.data?.id}');
        
        // Reset recording duration after successful upload
        _recordingDuration = Duration.zero;
      } else {
        debugPrint('Upload failed: ${uploadResult.error?.message}');
        _setError('Upload failed: ${uploadResult.error?.message}');
      }

    } catch (e, stackTrace) {
      debugPrint('Error uploading recording: $e');
      debugPrint('Stack trace: $stackTrace');
      
      final errorResult = AudioUploadResult<UploadResponse>.failure(
        AudioUploadError(
          code: 'UPLOAD_EXCEPTION',
          message: 'Upload error: ${e.toString()}',
          originalError: e,
        ),
      );
      
      _setUploadResult(errorResult);
      _setError('Upload error: ${e.toString()}');
    } finally {
      _setUploading(false);
    }
  }

  /// Handle app pause (stop recording safely)
  Future<void> handleAppPause() async {
    try {
      debugPrint('Handling app pause');
      
      if (isRecording) {
        // Pause recording instead of stopping to preserve user's work
        await pauseRecording();
      }
    } catch (e) {
      debugPrint('Error handling app pause: $e');
    }
  }

  /// Handle app resume
  Future<void> handleAppResume() async {
    try {
      debugPrint('Handling app resume');
      
      // Could implement resume logic here if needed
      // For now, just clear any transient errors
      if (hasError) {
        _clearError();
      }
    } catch (e) {
      debugPrint('Error handling app resume: $e');
    }
  }

  /// Clear current error
  void clearError() {
    _clearError();
  }

  /// Private state management methods
  void _setState(AudioRecordingState newState) {
    if (_state != newState) {
      _state = newState;
      notifyListeners();
    }
  }

  void _setProcessing(bool processing) {
    if (_isProcessing != processing) {
      _isProcessing = processing;
      notifyListeners();
    }
  }

  void _setUploading(bool uploading) {
    if (_isUploading != uploading) {
      _isUploading = uploading;
      notifyListeners();
    }
  }

  void _setError(String message) {
    _errorMessage = message;
    notifyListeners();
  }

  void _clearError() {
    if (_errorMessage != null) {
      _errorMessage = null;
      notifyListeners();
    }
  }

  void _setUploadResult(AudioUploadResult<UploadResponse> result) {
    _lastUploadResult = result;
    notifyListeners();
  }

  void _clearUploadResult() {
    if (_lastUploadResult != null) {
      _lastUploadResult = null;
      notifyListeners();
    }
  }

  /// Dispose resources
  @override
  void dispose() {
    debugPrint('Disposing AudioCaptureProvider');
    
    // Cancel subscriptions
    _stateSubscription?.cancel();
    _durationSubscription?.cancel();
    _amplitudeSubscription?.cancel();
    
    // Close amplitude controller
    _amplitudeController.close();
    
    // Dispose recorder service
    _recorderService.dispose();
    
    super.dispose();
  }
}
