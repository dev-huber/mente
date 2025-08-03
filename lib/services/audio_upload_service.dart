import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'package:dio/dio.dart';

/// Defensive Audio Upload Service with retry mechanism and comprehensive error handling
class AudioUploadService {
  static final AudioUploadService _instance = AudioUploadService._internal();
  factory AudioUploadService() => _instance;
  AudioUploadService._internal();

  final Logger _logger = Logger();
  final Dio _dio = Dio();
  static const String _apiEndpoint = 'https://api.quemmentemenos.com/upload/audio';
  static const int _maxRetries = 3;
  static const Duration _timeoutDuration = Duration(seconds: 30);

  /// Initialize upload service with defensive configuration
  void initialize() {
    _dio.options = BaseOptions(
      connectTimeout: _timeoutDuration,
      receiveTimeout: _timeoutDuration,
      sendTimeout: const Duration(minutes: 5), // Longer for file uploads
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
        'User-Agent': 'MentiraApp-Flutter/1.0.0',
      },
    );

    // Add interceptors for logging and error handling
    _dio.interceptors.add(
      LogInterceptor(
        logPrint: (obj) => _logger.d(obj.toString()),
        requestBody: false, // Don't log binary data
        responseBody: true,
        error: true,
      ),
    );

    // Add retry interceptor
    _dio.interceptors.add(_RetryInterceptor(_logger));
  }

  /// Upload audio file with comprehensive error handling and retry mechanism
  Future<AudioUploadResult> uploadAudio({
    required String filePath,
    String? userId,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      _logger.i('Starting audio upload: $filePath');

      // Pre-upload validations - fail fast
      final validationResult = await _validateFile(filePath);
      if (!validationResult.success) {
        return AudioUploadResult.failure(validationResult.error!);
      }

      final file = File(filePath);
      
      // Prepare form data
      final formData = await _prepareFormData(
        file: file,
        userId: userId,
        metadata: metadata,
      );

      // Execute upload with retry mechanism
      final response = await _executeUploadWithRetry(formData);
      
      if (response.success) {
        _logger.i('Audio upload completed successfully');
        
        // Cleanup temporary file
        await _cleanupFile(file);
        
        return response;
      } else {
        _logger.e('Audio upload failed: ${response.error}');
        return response;
      }

    } catch (e, stackTrace) {
      _logger.e('Unexpected error during upload', error: e, stackTrace: stackTrace);
      
      return AudioUploadResult.failure(
        AudioUploadError(
          code: 'UPLOAD_UNEXPECTED_ERROR',
          message: 'Unexpected error during upload: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }

  /// Validate file before upload
  Future<AudioUploadResult<bool>> _validateFile(String filePath) async {
    try {
      final file = File(filePath);

      // Check if file exists
      if (!await file.exists()) {
        return AudioUploadResult.failure(
          AudioUploadError(
            code: 'FILE_NOT_FOUND',
            message: 'Audio file not found: $filePath',
          ),
        );
      }

      // Check file size
      final fileSize = await file.length();
      const maxSizeMB = 50; // 50MB limit
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (fileSize == 0) {
        return AudioUploadResult.failure(
          AudioUploadError(
            code: 'FILE_EMPTY',
            message: 'Audio file is empty',
          ),
        );
      }

      if (fileSize > maxSizeBytes) {
        return AudioUploadResult.failure(
          AudioUploadError(
            code: 'FILE_TOO_LARGE',
            message: 'Audio file too large: ${(fileSize / 1024 / 1024).toStringAsFixed(1)}MB (max ${maxSizeMB}MB)',
          ),
        );
      }

      // Validate file extension
      final allowedExtensions = ['.aac', '.mp3', '.wav', '.m4a'];
      final extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'));
      
      if (!allowedExtensions.contains(extension)) {
        return AudioUploadResult.failure(
          AudioUploadError(
            code: 'INVALID_FILE_FORMAT',
            message: 'Unsupported file format: $extension. Allowed: ${allowedExtensions.join(', ')}',
          ),
        );
      }

      _logger.i('File validation passed: ${(fileSize / 1024).toStringAsFixed(1)}KB, $extension');
      return AudioUploadResult.success(true);

    } catch (e, stackTrace) {
      _logger.e('File validation failed', error: e, stackTrace: stackTrace);
      return AudioUploadResult.failure(
        AudioUploadError(
          code: 'FILE_VALIDATION_ERROR',
          message: 'Failed to validate file: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }

  /// Prepare multipart form data for upload
  Future<FormData> _prepareFormData({
    required File file,
    String? userId,
    Map<String, dynamic>? metadata,
  }) async {
    final fileName = file.path.split('/').last;
    
    final formData = FormData.fromMap({
      'audio': await MultipartFile.fromFile(
        file.path,
        filename: fileName,
      ),
      'timestamp': DateTime.now().toIso8601String(),
      'fileSize': await file.length(),
      'fileName': fileName,
      if (userId != null) 'userId': userId,
      if (metadata != null) 'metadata': jsonEncode(metadata),
    });

    return formData;
  }

  /// Execute upload with built-in retry mechanism
  Future<AudioUploadResult<UploadResponse>> _executeUploadWithRetry(
    FormData formData,
  ) async {
    int attempt = 0;
    AudioUploadError? lastError;

    while (attempt < _maxRetries) {
      attempt++;
      
      try {
        _logger.i('Upload attempt $attempt/$_maxRetries');

        final response = await _dio.post(
          _apiEndpoint,
          data: formData,
          options: Options(
            validateStatus: (status) => status != null && status >= 200 && status < 300,
          ),
        );

        // Success case
        if (response.statusCode == 200 || response.statusCode == 201) {
          final uploadResponse = UploadResponse.fromJson(response.data);
          
          return AudioUploadResult.success(uploadResponse);
        }

        // Handle non-success status codes
        lastError = AudioUploadError(
          code: 'HTTP_ERROR',
          message: 'Server returned status ${response.statusCode}: ${response.statusMessage}',
        );

      } catch (e) {
        _logger.w('Upload attempt $attempt failed: $e');
        
        if (e is DioException) {
          lastError = _handleDioException(e);
        } else {
          lastError = AudioUploadError(
            code: 'NETWORK_ERROR',
            message: 'Network error during upload: ${e.toString()}',
            originalError: e,
          );
        }

        // Don't retry on client errors (4xx)
        if (e is DioException && 
            e.response?.statusCode != null && 
            e.response!.statusCode! >= 400 && 
            e.response!.statusCode! < 500) {
          _logger.e('Client error, not retrying: ${e.response!.statusCode}');
          break;
        }
      }

      // Exponential backoff before retry
      if (attempt < _maxRetries) {
        final backoffDelay = Duration(seconds: attempt * 2);
        _logger.i('Waiting ${backoffDelay.inSeconds}s before retry...');
        await Future.delayed(backoffDelay);
      }
    }

    return AudioUploadResult.failure(
      lastError ?? AudioUploadError(
        code: 'UPLOAD_FAILED',
        message: 'Upload failed after $_maxRetries attempts',
      ),
    );
  }

  /// Handle Dio exceptions with specific error mapping
  AudioUploadError _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return AudioUploadError(
          code: 'TIMEOUT_ERROR',
          message: 'Upload timeout: ${e.message}',
          originalError: e,
        );
      
      case DioExceptionType.connectionError:
        return AudioUploadError(
          code: 'CONNECTION_ERROR',
          message: 'Connection error: Check your internet connection',
          originalError: e,
        );
      
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode ?? 0;
        final statusMessage = e.response?.statusMessage ?? 'Unknown error';
        
        return AudioUploadError(
          code: 'SERVER_ERROR',
          message: 'Server error $statusCode: $statusMessage',
          originalError: e,
        );
      
      case DioExceptionType.cancel:
        return AudioUploadError(
          code: 'UPLOAD_CANCELLED',
          message: 'Upload was cancelled',
          originalError: e,
        );
      
      default:
        return AudioUploadError(
          code: 'NETWORK_ERROR',
          message: 'Network error: ${e.message}',
          originalError: e,
        );
    }
  }

  /// Cleanup temporary file after successful upload
  Future<void> _cleanupFile(File file) async {
    try {
      if (await file.exists()) {
        await file.delete();
        _logger.i('Temporary file cleaned up: ${file.path}');
      }
    } catch (e) {
      _logger.w('Failed to cleanup file: $e');
      // Non-critical error, don't propagate
    }
  }

  /// Check upload service health
  Future<AudioUploadResult<bool>> checkHealth() async {
    try {
      final healthEndpoint = _apiEndpoint.replaceAll('/upload/audio', '/health');
      
      final response = await _dio.get(
        healthEndpoint,
        options: Options(
          sendTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );

      return AudioUploadResult.success(response.statusCode == 200);
      
    } catch (e) {
      _logger.w('Health check failed: $e');
      return AudioUploadResult.failure(
        AudioUploadError(
          code: 'HEALTH_CHECK_FAILED',
          message: 'Service health check failed: ${e.toString()}',
          originalError: e,
        ),
      );
    }
  }
}

/// Custom retry interceptor for Dio
class _RetryInterceptor extends Interceptor {
  final Logger _logger;

  _RetryInterceptor(this._logger);

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    _logger.w('Request failed: ${err.requestOptions.uri} - ${err.message}');
    super.onError(err, handler);
  }
}

/// Upload result wrapper
class AudioUploadResult<T> {
  final bool success;
  final T? data;
  final AudioUploadError? error;

  const AudioUploadResult._({
    required this.success,
    this.data,
    this.error,
  });

  factory AudioUploadResult.success(T data) {
    return AudioUploadResult._(success: true, data: data);
  }

  factory AudioUploadResult.failure(AudioUploadError error) {
    return AudioUploadResult._(success: false, error: error);
  }
}

/// Structured upload error
class AudioUploadError {
  final String code;
  final String message;
  final Object? originalError;

  const AudioUploadError({
    required this.code,
    required this.message,
    this.originalError,
  });

  @override
  String toString() => '$code: $message';
}

/// Upload response model
class UploadResponse {
  final String id;
  final String status;
  final String? url;
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;

  const UploadResponse({
    required this.id,
    required this.status,
    this.url,
    required this.timestamp,
    this.metadata,
  });

  factory UploadResponse.fromJson(Map<String, dynamic> json) {
    return UploadResponse(
      id: json['id'] as String,
      status: json['status'] as String,
      url: json['url'] as String?,
      timestamp: DateTime.parse(json['timestamp'] as String),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'url': url,
      'timestamp': timestamp.toIso8601String(),
      'metadata': metadata,
    };
  }
}
