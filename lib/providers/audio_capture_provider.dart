import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/audio_recorder_service.dart';
import '../services/audio_upload_service.dart';

/// Defensive provider for audio capture functionality with comprehensive state management
class AudioCaptureProvider extends ChangeNotifier {
  // Services
  final AudioRecorderService _recorderService = AudioRecorderService();
  final AudioUploadService _uploadService = AudioUploadService();

  // State management
  AudioRecordingState _state = AudioRecordingState.uninitialized;
  Duration _recordingDuration = Duration.zero;
  bool _isProcessing = false;
  bool _isUploading = false;
  String? _errorMessage;
  AudioUploadResult<UploadResponse>? _lastUploadResult;

  // Streams
  StreamSubscription<AudioRecordingState>? _stateSubscription;
  StreamSubscription<Duration>? _durationSubscription;
  StreamSubscription<double>? _amplitudeSubscription;

  // Stream controllers for UI
  final StreamController<double> _amplitudeController = 
      StreamController<double>.broadcast();

  // Getters
  AudioRecordingState get state => _state;
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
