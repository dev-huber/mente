import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/audio_recorder_service.dart';
import '../services/audio_upload_service.dart';
import '../widgets/audio_waveform_widget.dart';
import '../providers/audio_capture_provider.dart';

/// Defensive Audio Capture Page with comprehensive error handling and UX
class AudioCapturePage extends StatefulWidget {
  const AudioCapturePage({Key? key}) : super(key: key);

  @override
  State<AudioCapturePage> createState() => _AudioCapturePageState();
}

class _AudioCapturePageState extends State<AudioCapturePage>
    with WidgetsBindingObserver {
  
  late AudioCaptureProvider _provider;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeServices();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    
    // Handle app lifecycle changes defensively
    if (state == AppLifecycleState.paused || state == AppLifecycleState.detached) {
      _provider.handleAppPause();
    } else if (state == AppLifecycleState.resumed) {
      _provider.handleAppResume();
    }
  }

  /// Initialize audio services with error handling
  Future<void> _initializeServices() async {
    try {
      _provider = context.read<AudioCaptureProvider>();
      await _provider.initialize();
      
      if (mounted) {
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      debugPrint('Failed to initialize audio services: $e');
      if (mounted) {
        _showErrorDialog('Initialization Error', 
          'Failed to initialize audio services. Please restart the app.');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: _buildAppBar(),
      body: _isInitialized 
          ? _buildMainContent()
          : _buildLoadingView(),
    );
  }

  /// Build app bar with defensive design
  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      title: const Text(
        'Audio Capture',
        style: TextStyle(
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
      ),
      backgroundColor: Colors.deepPurple,
      elevation: 0,
      actions: [
        Consumer<AudioCaptureProvider>(
          builder: (context, provider, child) {
            return PopupMenuButton<String>(
              onSelected: _handleMenuAction,
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'settings',
                  child: Row(
                    children: const [
                      Icon(Icons.settings, size: 20),
                      SizedBox(width: 8),
                      Text('Settings'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'test_connection',
                  child: Row(
                    children: const [
                      Icon(Icons.network_check, size: 20),
                      SizedBox(width: 8),
                      Text('Test Connection'),
                    ],
                  ),
                ),
              ],
            );
          },
        ),
      ],
    );
  }

  /// Build main content with error boundaries
  Widget _buildMainContent() {
    return Consumer<AudioCaptureProvider>(
      builder: (context, provider, child) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              children: [
                _buildStatusCard(provider),
                const SizedBox(height: 20),
                _buildWaveformSection(provider),
                const SizedBox(height: 30),
                _buildTimerSection(provider),
                const SizedBox(height: 30),
                _buildControlButtons(provider),
                const SizedBox(height: 20),
                _buildUploadStatus(provider),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Build loading view with timeout handling
  Widget _buildLoadingView() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text(
            'Initializing audio services...',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  /// Build status card with comprehensive state display
  Widget _buildStatusCard(AudioCaptureProvider provider) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            _buildStatusIcon(provider.state),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _getStateTitle(provider.state),
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _getStateDescription(provider.state),
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            if (provider.hasError)
              IconButton(
                icon: const Icon(Icons.error_outline, color: Colors.red),
                onPressed: () => _showErrorDetails(provider.errorMessage),
              ),
          ],
        ),
      ),
    );
  }

  /// Build waveform visualization section
  Widget _buildWaveformSection(AudioCaptureProvider provider) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.graphic_eq, color: Colors.deepPurple),
                const SizedBox(width: 8),
                const Text(
                  'Audio Visualization',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 100,
              child: provider.hasError
                  ? _buildErrorFallback()
                  : AudioWaveformWidget(
                      amplitudeStream: provider.amplitudeStream,
                      isRecording: provider.isRecording,
                      duration: provider.recordingDuration,
                      waveColor: Colors.deepPurple,
                      height: 100,
                    ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build timer section with formatted display
  Widget _buildTimerSection(AudioCaptureProvider provider) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.timer, color: Colors.deepPurple, size: 24),
            const SizedBox(width: 12),
            Text(
              _formatDuration(provider.recordingDuration),
              style: const TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w300,
                fontFamily: 'monospace',
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Build control buttons with state-aware design
  Widget _buildControlButtons(AudioCaptureProvider provider) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        _buildControlButton(
          icon: provider.isRecording && !provider.isPaused
              ? Icons.pause
              : Icons.fiber_manual_record,
          label: provider.isRecording && !provider.isPaused
              ? 'Pause'
              : provider.isPaused
                  ? 'Resume'
                  : 'Record',
          color: provider.isRecording && !provider.isPaused
              ? Colors.orange
              : Colors.red,
          onPressed: provider.isProcessing
              ? null
              : () => _handleRecordToggle(provider),
        ),
        _buildControlButton(
          icon: Icons.stop,
          label: 'Stop',
          color: Colors.grey[700]!,
          onPressed: (!provider.isRecording || provider.isProcessing)
              ? null
              : () => _handleStop(provider),
        ),
      ],
    );
  }

  /// Build individual control button
  Widget _buildControlButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback? onPressed,
  }) {
    final isEnabled = onPressed != null;
    
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: isEnabled ? color : Colors.grey[300],
            shape: BoxShape.circle,
            boxShadow: isEnabled ? [
              BoxShadow(
                color: color.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ] : null,
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(40),
              onTap: onPressed,
              child: Icon(
                icon,
                color: isEnabled ? Colors.white : Colors.grey[500],
                size: 32,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: isEnabled ? color : Colors.grey[500],
          ),
        ),
      ],
    );
  }

  /// Build upload status display
  Widget _buildUploadStatus(AudioCaptureProvider provider) {
    if (!provider.isUploading && provider.lastUploadResult == null) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(
                  provider.isUploading
                      ? Icons.cloud_upload
                      : provider.lastUploadResult!.success
                          ? Icons.cloud_done
                          : Icons.cloud_off,
                  color: provider.isUploading
                      ? Colors.blue
                      : provider.lastUploadResult!.success
                          ? Colors.green
                          : Colors.red,
                ),
                const SizedBox(width: 8),
                Text(
                  provider.isUploading
                      ? 'Uploading...'
                      : provider.lastUploadResult!.success
                          ? 'Upload Successful'
                          : 'Upload Failed',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            if (provider.isUploading) ...[
              const SizedBox(height: 8),
              const LinearProgressIndicator(),
            ],
            if (!provider.isUploading && provider.lastUploadResult != null) ...[
              const SizedBox(height: 8),
              Text(
                provider.lastUploadResult!.success
                    ? 'Audio uploaded successfully and is being processed.'
                    : 'Upload failed: ${provider.lastUploadResult!.error?.message ?? "Unknown error"}',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  /// Build error fallback widget
  Widget _buildErrorFallback() {
    return Container(
      height: 100,
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, color: Colors.red, size: 24),
            SizedBox(height: 4),
            Text(
              'Visualization Error',
              style: TextStyle(
                color: Colors.red,
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Handle record/pause toggle with haptic feedback
  Future<void> _handleRecordToggle(AudioCaptureProvider provider) async {
    try {
      HapticFeedback.lightImpact();
      
      if (!provider.isRecording) {
        await provider.startRecording();
      } else if (provider.isPaused) {
        await provider.resumeRecording();
      } else {
        await provider.pauseRecording();
      }
    } catch (e) {
      _showErrorDialog('Recording Error', e.toString());
    }
  }

  /// Handle stop recording with haptic feedback
  Future<void> _handleStop(AudioCaptureProvider provider) async {
    try {
      HapticFeedback.mediumImpact();
      await provider.stopRecording();
    } catch (e) {
      _showErrorDialog('Stop Recording Error', e.toString());
    }
  }

  /// Handle menu actions
  void _handleMenuAction(String action) {
    switch (action) {
      case 'settings':
        _showSettingsDialog();
        break;
      case 'test_connection':
        _testConnection();
        break;
    }
  }

  /// Show settings dialog
  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Settings'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.mic),
              title: Text('Audio Quality'),
              subtitle: Text('High Quality (44.1kHz)'),
            ),
            ListTile(
              leading: Icon(Icons.storage),
              title: Text('Storage'),
              subtitle: Text('Auto-cleanup after upload'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  /// Test API connection
  Future<void> _testConnection() async {
    try {
      _showLoadingDialog('Testing connection...');
      
      final uploadService = AudioUploadService();
      final result = await uploadService.checkHealth();
      
      Navigator.pop(context); // Close loading dialog
      
      if (result.success) {
        _showSuccessDialog('Connection Test', 'API connection is working properly.');
      } else {
        _showErrorDialog('Connection Test Failed', result.error?.message ?? 'Unknown error');
      }
    } catch (e) {
      Navigator.pop(context); // Close loading dialog
      _showErrorDialog('Connection Test Error', e.toString());
    }
  }

  /// Show error dialog
  void _showErrorDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  /// Show success dialog
  void _showSuccessDialog(String title, String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  /// Show loading dialog
  void _showLoadingDialog(String message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        content: Row(
          children: [
            const CircularProgressIndicator(),
            const SizedBox(width: 20),
            Expanded(child: Text(message)),
          ],
        ),
      ),
    );
  }

  /// Show error details
  void _showErrorDetails(String? errorMessage) {
    if (errorMessage == null) return;
    
    _showErrorDialog('Error Details', errorMessage);
  }

  /// Get status icon based on current state
  Icon _buildStatusIcon(AudioRecordingState state) {
    switch (state) {
      case AudioRecordingState.uninitialized:
        return const Icon(Icons.mic_off, color: Colors.grey);
      case AudioRecordingState.initialized:
        return const Icon(Icons.mic, color: Colors.green);
      case AudioRecordingState.recording:
        return const Icon(Icons.fiber_manual_record, color: Colors.red);
      case AudioRecordingState.paused:
        return const Icon(Icons.pause, color: Colors.orange);
      case AudioRecordingState.stopped:
        return const Icon(Icons.stop, color: Colors.grey);
      case AudioRecordingState.error:
        return const Icon(Icons.error, color: Colors.red);
    }
  }

  /// Get state title
  String _getStateTitle(AudioRecordingState state) {
    switch (state) {
      case AudioRecordingState.uninitialized:
        return 'Not Ready';
      case AudioRecordingState.initialized:
        return 'Ready to Record';
      case AudioRecordingState.recording:
        return 'Recording...';
      case AudioRecordingState.paused:
        return 'Paused';
      case AudioRecordingState.stopped:
        return 'Recording Stopped';
      case AudioRecordingState.error:
        return 'Error';
    }
  }

  /// Get state description
  String _getStateDescription(AudioRecordingState state) {
    switch (state) {
      case AudioRecordingState.uninitialized:
        return 'Initializing audio services...';
      case AudioRecordingState.initialized:
        return 'Tap record to start';
      case AudioRecordingState.recording:
        return 'Capturing audio input';
      case AudioRecordingState.paused:
        return 'Recording is paused';
      case AudioRecordingState.stopped:
        return 'Processing and uploading...';
      case AudioRecordingState.error:
        return 'An error occurred';
    }
  }

  /// Format duration for display
  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }
}
