import 'dart:async';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter_sound/flutter_sound.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import 'package:logger/logger.dart';
import 'package:uuid/uuid.dart';

/// Defensive Audio Recording Service with comprehensive error handling
/// Implements fail-fast principles with graceful degradation
class AudioRecorderService {
  static final AudioRecorderService _instance = AudioRecorderService._internal();
  factory AudioRecorderService() => _instance;
  AudioRecorderService._internal();

  // Core components
  FlutterSoundRecorder? _recorder;
  FlutterSoundPlayer? _player;
  final Logger _logger = Logger();
  final Uuid _uuid = const Uuid();

  // State management
  bool _isInitialized = false;
  bool _isRecording = false;
  bool _isPaused = false;
  String? _currentRecordingPath;
  StreamSubscription<RecordingDisposition>? _recordingSubscription;

  // Stream controllers for reactive UI
  final StreamController<AudioRecordingState> _stateController = 
      StreamController<AudioRecordingState>.broadcast();
  final StreamController<Duration> _durationController = 
      StreamController<Duration>.broadcast();
  final StreamController<double> _amplitudeController = 
      StreamController<double>.broadcast();

  // Getters for streams
  Stream<AudioRecordingState> get stateStream => _stateController.stream;
  Stream<Duration> get durationStream => _durationController.stream;
  Stream<double> get amplitudeStream => _amplitudeController.stream;

  // Current state getters
  bool get isInitialized => _isInitialized;
  bool get isRecording => _isRecording;
  bool get isPaused => _isPaused;
  String? get currentRecordingPath => _currentRecordingPath;

  /// Initialize the audio recorder with comprehensive error handling
  /// Returns Result pattern for defensive error handling
  Future<AudioServiceResult<bool>> initialize() async {
    try {
      _logger.i('Initializing AudioRecorderService');

      // Early validation - fail fast
      if (_isInitialized) {
        _logger.w('AudioRecorderService already initialized');
        return AudioServiceResult.success(true);
      }

      // Check and request permissions
      final permissionResult = await _requestPermissions();
      if (!permissionResult.success) {
        _logger.e('Permission request failed: ${permissionResult.error}');
        return AudioServiceResult.failure(permissionResult.error!);
      }

      // Initialize recording components
      _recorder = FlutterSoundRecorder();
      _player = FlutterSoundPlayer();

      // Open recorder session with timeout
      await _recorder!.openRecorder().timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw TimeoutException('Recorder initialization timeout', const Duration(seconds: 10));
        },
      );

      // Open player session for testing
      await _player!.openPlayer().timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          throw TimeoutException('Player initialization timeout', const Duration(seconds: 5));
        },
      );

      _isInitialized = true;
      _stateController.add(AudioRecordingState.initialized);
      
      _logger.i('AudioRecorderService initialized successfully');
      return AudioServiceResult.success(true);

    } catch (e, stackTrace) {
      _logger.e('Failed to initialize AudioRecorderService', error: e, stackTrace: stackTrace);
      
      // Cleanup on failure
      await _cleanup();
      
      return AudioServiceResult.failure(
        AudioServiceError(
          code: 'INITIALIZATION_FAILED',
          message: 'Failed to initialize audio recorder: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }

  /// Request and validate microphone permissions
  Future<AudioServiceResult<bool>> _requestPermissions() async {
    try {
      _logger.i('Requesting microphone permissions');

      final status = await Permission.microphone.status;
      
      if (status.isGranted) {
        _logger.i('Microphone permission already granted');
        return AudioServiceResult.success(true);
      }

      if (status.isPermanentlyDenied) {
        _logger.e('Microphone permission permanently denied');
        return AudioServiceResult.failure(
          AudioServiceError(
            code: 'PERMISSION_PERMANENTLY_DENIED',
            message: 'Microphone permission is permanently denied. Please enable it in settings.',
          ),
        );
      }

      // Request permission
      final result = await Permission.microphone.request();
      
      if (result.isGranted) {
        _logger.i('Microphone permission granted');
        return AudioServiceResult.success(true);
      } else {
        _logger.e('Microphone permission denied: $result');
        return AudioServiceResult.failure(
          AudioServiceError(
            code: 'PERMISSION_DENIED',
            message: 'Microphone permission is required to record audio.',
          ),
        );
      }

    } catch (e, stackTrace) {
      _logger.e('Permission request failed', error: e, stackTrace: stackTrace);
      return AudioServiceResult.failure(
        AudioServiceError(
          code: 'PERMISSION_REQUEST_FAILED',
          message: 'Failed to request microphone permission: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }

  /// Start recording with comprehensive validation and error handling
  Future<AudioServiceResult<String>> startRecording() async {
    try {
      _logger.i('Starting audio recording');

      // Pre-recording validations - fail fast
      if (!_isInitialized) {
        return AudioServiceResult.failure(
          AudioServiceError(
            code: 'NOT_INITIALIZED',
            message: 'AudioRecorderService not initialized. Call initialize() first.',
          ),
        );
      }

      if (_isRecording) {
        _logger.w('Recording already in progress');
        return AudioServiceResult.failure(
          AudioServiceError(
            code: 'ALREADY_RECORDING',
            message: 'Recording is already in progress.',
          ),
        );
      }

      if (_recorder == null) {
        _logger.e('Recorder is null after initialization');
        return AudioServiceResult.failure(
          AudioServiceError(
            code: 'RECORDER_NULL',
            message: 'Internal error: recorder is null.',
          ),
        );
      }

      // Validate storage space
      final storageValidation = await _validateStorageSpace();
      if (!storageValidation.success) {
        return AudioServiceResult.failure(storageValidation.error!);
      }

      // Generate unique filename
      final fileName = 'recording_${_uuid.v4()}.aac';
      final directory = await getApplicationDocumentsDirectory();
      final filePath = '${directory.path}/$fileName';

      // Configure recording parameters
      const codec = Codec.aacADTS;
      const sampleRate = 44100;
      const numChannels = 1;

      // Start recording with timeout
      await _recorder!.startRecorder(
        toFile: filePath,
        codec: codec,
        sampleRate: sampleRate,
        numChannels: numChannels,
      ).timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          throw TimeoutException('Failed to start recording', const Duration(seconds: 5));
        },
      );

      // Set up recording monitoring
      _recordingSubscription = _recorder!.onProgress!.listen(
        _onRecordingProgress,
        onError: _onRecordingError,
        onDone: _onRecordingDone,
      );

      // Update state
      _isRecording = true;
      _isPaused = false;
      _currentRecordingPath = filePath;
      _stateController.add(AudioRecordingState.recording);

      _logger.i('Recording started successfully: $filePath');
      return AudioServiceResult.success(filePath);

    } catch (e, stackTrace) {
      _logger.e('Failed to start recording', error: e, stackTrace: stackTrace);
      
      // Cleanup on failure
      await _resetRecordingState();
      
      return AudioServiceResult.failure(
        AudioServiceError(
          code: 'START_RECORDING_FAILED',
          message: 'Failed to start recording: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }

  /// Pause recording with state validation
  Future<AudioServiceResult<bool>> pauseRecording() async {
    try {
      _logger.i('Pausing audio recording');

      if (!_isRecording || _isPaused) {
        return AudioServiceResult.failure(
          AudioServiceError(
            code: 'INVALID_STATE',
            message: 'Cannot pause: not recording or already paused.',
          ),
        );
      }

      await _recorder!.pauseRecorder();
      _isPaused = true;
      _stateController.add(AudioRecordingState.paused);

      _logger.i('Recording paused successfully');
      return AudioServiceResult.success(true);

    } catch (e, stackTrace) {
      _logger.e('Failed to pause recording', error: e, stackTrace: stackTrace);
      return AudioServiceResult.failure(
        AudioServiceError(
          code: 'PAUSE_FAILED',
          message: 'Failed to pause recording: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }

  /// Resume recording with state validation
  Future<AudioServiceResult<bool>> resumeRecording() async {
    try {
      _logger.i('Resuming audio recording');

      if (!_isRecording || !_isPaused) {
        return AudioServiceResult.failure(
          AudioServiceError(
            code: 'INVALID_STATE',
            message: 'Cannot resume: not recording or not paused.',
          ),
        );
      }

      await _recorder!.resumeRecorder();
      _isPaused = false;
      _stateController.add(AudioRecordingState.recording);

      _logger.i('Recording resumed successfully');
      return AudioServiceResult.success(true);

    } catch (e, stackTrace) {
      _logger.e('Failed to resume recording', error: e, stackTrace: stackTrace);
      return AudioServiceResult.failure(
        AudioServiceError(
          code: 'RESUME_FAILED',
          message: 'Failed to resume recording: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }

  /// Stop recording with cleanup and validation
  Future<AudioServiceResult<String>> stopRecording() async {
    try {
      _logger.i('Stopping audio recording');

      if (!_isRecording) {
        return AudioServiceResult.failure(
          AudioServiceError(
            code: 'NOT_RECORDING',
            message: 'No recording in progress.',
          ),
        );
      }

      // Stop the recorder
      await _recorder!.stopRecorder();
      
      // Cancel subscription
      await _recordingSubscription?.cancel();
      _recordingSubscription = null;

      final recordingPath = _currentRecordingPath;
      
      // Reset state
      await _resetRecordingState();
      _stateController.add(AudioRecordingState.stopped);

      // Validate recorded file
      if (recordingPath != null) {
        final file = File(recordingPath);
        if (await file.exists()) {
          final fileSize = await file.length();
          if (fileSize > 0) {
            _logger.i('Recording stopped successfully: $recordingPath (${fileSize} bytes)');
            return AudioServiceResult.success(recordingPath);
          } else {
            _logger.e('Recorded file is empty: $recordingPath');
            await file.delete().catchError((e) => 
              _logger.w('Failed to delete empty file: $e'));
          }
        } else {
          _logger.e('Recorded file does not exist: $recordingPath');
        }
      }

      return AudioServiceResult.failure(
        AudioServiceError(
          code: 'RECORDING_FILE_INVALID',
          message: 'Recording completed but file is invalid or empty.',
        ),
      );

    } catch (e, stackTrace) {
      _logger.e('Failed to stop recording', error: e, stackTrace: stackTrace);
      
      // Force cleanup on error
      await _resetRecordingState();
      
      return AudioServiceResult.failure(
        AudioServiceError(
          code: 'STOP_RECORDING_FAILED',
          message: 'Failed to stop recording: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }

  /// Validate available storage space
  Future<AudioServiceResult<bool>> _validateStorageSpace() async {
    try {
      const requiredSpaceMB = 100; // 100MB minimum
      
      // This is a simplified check - in production, implement actual disk space validation
      final directory = await getApplicationDocumentsDirectory();
      if (!await directory.exists()) {
        return AudioServiceResult.failure(
          AudioServiceError(
            code: 'STORAGE_UNAVAILABLE',
            message: 'Storage directory is not available.',
          ),
        );
      }

      return AudioServiceResult.success(true);
    } catch (e) {
      return AudioServiceResult.failure(
        AudioServiceError(
          code: 'STORAGE_VALIDATION_FAILED',
          message: 'Failed to validate storage space: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }

  /// Handle recording progress updates
  void _onRecordingProgress(RecordingDisposition disposition) {
    try {
      _durationController.add(disposition.duration);
      
      // Calculate amplitude for waveform visualization
      final amplitude = disposition.decibels != null 
          ? (disposition.decibels! + 60) / 60 // Normalize -60dB to 0dB as 0.0 to 1.0
          : 0.0;
      
      _amplitudeController.add(amplitude.clamp(0.0, 1.0));
      
    } catch (e) {
      _logger.w('Error processing recording progress: $e');
    }
  }

  /// Handle recording errors
  void _onRecordingError(Object error) {
    _logger.e('Recording error: $error');
    _stateController.add(AudioRecordingState.error);
  }

  /// Handle recording completion
  void _onRecordingDone() {
    _logger.i('Recording stream completed');
  }

  /// Reset recording state
  Future<void> _resetRecordingState() async {
    _isRecording = false;
    _isPaused = false;
    _currentRecordingPath = null;
    await _recordingSubscription?.cancel();
    _recordingSubscription = null;
  }

  /// Cleanup resources
  Future<void> _cleanup() async {
    try {
      await _resetRecordingState();
      await _recorder?.closeRecorder();
      await _player?.closePlayer();
      _recorder = null;
      _player = null;
      _isInitialized = false;
    } catch (e) {
      _logger.w('Error during cleanup: $e');
    }
  }

  /// Dispose resources and close streams
  Future<void> dispose() async {
    _logger.i('Disposing AudioRecorderService');
    
    await _cleanup();
    
    await _stateController.close();
    await _durationController.close();
    await _amplitudeController.close();
  }
}

/// Audio recording states for reactive UI
enum AudioRecordingState {
  uninitialized,
  initialized,
  recording,
  paused,
  stopped,
  error,
}

/// Result pattern for defensive error handling
class AudioServiceResult<T> {
  final bool success;
  final T? data;
  final AudioServiceError? error;

  const AudioServiceResult._({
    required this.success,
    this.data,
    this.error,
  });

  factory AudioServiceResult.success(T data) {
    return AudioServiceResult._(success: true, data: data);
  }

  factory AudioServiceResult.failure(AudioServiceError error) {
    return AudioServiceResult._(success: false, error: error);
  }
}

/// Structured error information
class AudioServiceError {
  final String code;
  final String message;
  final Object? originalError;

  const AudioServiceError({
    required this.code,
    required this.message,
    this.originalError,
  });

  @override
  String toString() => '$code: $message';
}
