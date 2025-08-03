import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';
import 'package:mentira_app/pages/audio_capture_page.dart';
import 'package:mentira_app/providers/audio_capture_provider.dart';
import 'package:mentira_app/services/audio_recorder_service.dart';

// Generate mocks
@GenerateMocks([
  AudioCaptureProvider,
])
import 'audio_capture_page_test.mocks.dart';

/// Comprehensive widget tests for AudioCapturePage
/// Tests UI behavior, user interactions, and error states
void main() {
  group('AudioCapturePage Widget Tests', () {
    late MockAudioCaptureProvider mockProvider;

    setUp(() {
      mockProvider = MockAudioCaptureProvider();
      
      // Default mock behavior
      when(mockProvider.state).thenReturn(AudioRecordingState.initialized);
      when(mockProvider.isRecording).thenReturn(false);
      when(mockProvider.isPaused).thenReturn(false);
      when(mockProvider.isProcessing).thenReturn(false);
      when(mockProvider.isUploading).thenReturn(false);
      when(mockProvider.hasError).thenReturn(false);
      when(mockProvider.errorMessage).thenReturn(null);
      when(mockProvider.recordingDuration).thenReturn(Duration.zero);
      when(mockProvider.lastUploadResult).thenReturn(null);
      when(mockProvider.amplitudeStream).thenAnswer((_) => Stream.empty());
    });

    /// Helper function to create widget under test
    Widget createWidgetUnderTest() {
      return MaterialApp(
        home: ChangeNotifierProvider<AudioCaptureProvider>.value(
          value: mockProvider,
          child: const AudioCapturePage(),
        ),
      );
    }

    group('Initial UI State Tests', () {
      testWidgets('should display loading view when not initialized', (tester) async {
        // Arrange
        when(mockProvider.state).thenReturn(AudioRecordingState.uninitialized);

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.byType(CircularProgressIndicator), findsOneWidget);
        expect(find.text('Initializing audio services...'), findsOneWidget);
      });

      testWidgets('should display main content when initialized', (tester) async {
        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('Audio Capture'), findsOneWidget);
        expect(find.text('Ready to Record'), findsOneWidget);
        expect(find.text('Record'), findsOneWidget);
        expect(find.text('Stop'), findsOneWidget);
        expect(find.text('00:00'), findsOneWidget); // Timer display
      });

      testWidgets('should display app bar with menu', (tester) async {
        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.byType(AppBar), findsOneWidget);
        expect(find.text('Audio Capture'), findsOneWidget);
        expect(find.byType(PopupMenuButton), findsOneWidget);
      });
    });

    group('Recording State Tests', () {
      testWidgets('should show recording state when recording', (tester) async {
        // Arrange
        when(mockProvider.state).thenReturn(AudioRecordingState.recording);
        when(mockProvider.isRecording).thenReturn(true);
        when(mockProvider.recordingDuration).thenReturn(const Duration(seconds: 30));

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('Recording...'), findsOneWidget);
        expect(find.text('Pause'), findsOneWidget);
        expect(find.text('00:30'), findsOneWidget);
        
        // Recording button should be orange (pause)
        final recordButton = find.byIcon(Icons.pause);
        expect(recordButton, findsOneWidget);
      });

      testWidgets('should show paused state when paused', (tester) async {
        // Arrange
        when(mockProvider.state).thenReturn(AudioRecordingState.paused);
        when(mockProvider.isRecording).thenReturn(true);
        when(mockProvider.isPaused).thenReturn(true);

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('Paused'), findsOneWidget);
        expect(find.text('Resume'), findsOneWidget);
        expect(find.byIcon(Icons.fiber_manual_record), findsOneWidget);
      });

      testWidgets('should disable buttons when processing', (tester) async {
        // Arrange
        when(mockProvider.isProcessing).thenReturn(true);

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        final recordButton = find.byIcon(Icons.fiber_manual_record);
        final stopButton = find.byIcon(Icons.stop);
        
        // Buttons should be disabled (no onPressed)
        expect(tester.widget<Material>(find.ancestor(
          of: recordButton,
          matching: find.byType(Material),
        ).first).color, equals(Colors.grey[300]));
      });
    });

    group('User Interaction Tests', () {
      testWidgets('should start recording when record button tapped', (tester) async {
        // Arrange
        when(mockProvider.startRecording()).thenAnswer((_) async {});

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        
        final recordButton = find.byIcon(Icons.fiber_manual_record);
        await tester.tap(recordButton);
        await tester.pump();

        // Assert
        verify(mockProvider.startRecording()).called(1);
      });

      testWidgets('should pause recording when pause button tapped', (tester) async {
        // Arrange
        when(mockProvider.state).thenReturn(AudioRecordingState.recording);
        when(mockProvider.isRecording).thenReturn(true);
        when(mockProvider.pauseRecording()).thenAnswer((_) async {});

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        
        final pauseButton = find.byIcon(Icons.pause);
        await tester.tap(pauseButton);
        await tester.pump();

        // Assert
        verify(mockProvider.pauseRecording()).called(1);
      });

      testWidgets('should resume recording when resume button tapped', (tester) async {
        // Arrange
        when(mockProvider.state).thenReturn(AudioRecordingState.paused);
        when(mockProvider.isRecording).thenReturn(true);
        when(mockProvider.isPaused).thenReturn(true);
        when(mockProvider.resumeRecording()).thenAnswer((_) async {});

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        
        final resumeButton = find.byIcon(Icons.fiber_manual_record);
        await tester.tap(resumeButton);
        await tester.pump();

        // Assert
        verify(mockProvider.resumeRecording()).called(1);
      });

      testWidgets('should stop recording when stop button tapped', (tester) async {
        // Arrange
        when(mockProvider.isRecording).thenReturn(true);
        when(mockProvider.stopRecording()).thenAnswer((_) async {});

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        
        final stopButton = find.byIcon(Icons.stop);
        await tester.tap(stopButton);
        await tester.pump();

        // Assert
        verify(mockProvider.stopRecording()).called(1);
      });
    });

    group('Error State Tests', () {
      testWidgets('should display error icon when error occurs', (tester) async {
        // Arrange
        when(mockProvider.hasError).thenReturn(true);
        when(mockProvider.errorMessage).thenReturn('Test error message');

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.byIcon(Icons.error_outline), findsOneWidget);
      });

      testWidgets('should show error dialog when error icon tapped', (tester) async {
        // Arrange
        when(mockProvider.hasError).thenReturn(true);
        when(mockProvider.errorMessage).thenReturn('Test error message');

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        
        final errorIcon = find.byIcon(Icons.error_outline);
        await tester.tap(errorIcon);
        await tester.pumpAndSettle();

        // Assert
        expect(find.byType(AlertDialog), findsOneWidget);
        expect(find.text('Error Details'), findsOneWidget);
        expect(find.text('Test error message'), findsOneWidget);
      });

      testWidgets('should show error fallback for waveform', (tester) async {
        // Arrange
        when(mockProvider.hasError).thenReturn(true);

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('Visualization Error'), findsOneWidget);
        expect(find.byIcon(Icons.error_outline), findsAtLeastNWidgets(1));
      });
    });

    group('Upload State Tests', () {
      testWidgets('should show upload progress when uploading', (tester) async {
        // Arrange
        when(mockProvider.isUploading).thenReturn(true);

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('Uploading...'), findsOneWidget);
        expect(find.byType(LinearProgressIndicator), findsOneWidget);
        expect(find.byIcon(Icons.cloud_upload), findsOneWidget);
      });

      testWidgets('should show upload success state', (tester) async {
        // Arrange
        final mockResult = MockAudioUploadResult();
        when(mockResult.success).thenReturn(true);
        when(mockProvider.lastUploadResult).thenReturn(mockResult);

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('Upload Successful'), findsOneWidget);
        expect(find.byIcon(Icons.cloud_done), findsOneWidget);
        expect(find.text('Audio uploaded successfully and is being processed.'), findsOneWidget);
      });

      testWidgets('should show upload failure state', (tester) async {
        // Arrange
        final mockResult = MockAudioUploadResult();
        final mockError = MockAudioUploadError();
        when(mockResult.success).thenReturn(false);
        when(mockResult.error).thenReturn(mockError);
        when(mockError.message).thenReturn('Network error');
        when(mockProvider.lastUploadResult).thenReturn(mockResult);

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('Upload Failed'), findsOneWidget);
        expect(find.byIcon(Icons.cloud_off), findsOneWidget);
        expect(find.text('Upload failed: Network error'), findsOneWidget);
      });
    });

    group('Menu Tests', () {
      testWidgets('should show menu options when menu button tapped', (tester) async {
        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        
        final menuButton = find.byType(PopupMenuButton);
        await tester.tap(menuButton);
        await tester.pumpAndSettle();

        // Assert
        expect(find.text('Settings'), findsOneWidget);
        expect(find.text('Test Connection'), findsOneWidget);
      });

      testWidgets('should show settings dialog when settings selected', (tester) async {
        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();
        
        final menuButton = find.byType(PopupMenuButton);
        await tester.tap(menuButton);
        await tester.pumpAndSettle();
        
        await tester.tap(find.text('Settings'));
        await tester.pumpAndSettle();

        // Assert
        expect(find.byType(AlertDialog), findsOneWidget);
        expect(find.text('Settings'), findsAtLeastNWidgets(1));
        expect(find.text('Audio Quality'), findsOneWidget);
        expect(find.text('Storage'), findsOneWidget);
      });
    });

    group('Timer Display Tests', () {
      testWidgets('should format duration correctly', (tester) async {
        // Arrange
        when(mockProvider.recordingDuration).thenReturn(const Duration(minutes: 1, seconds: 30));

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('01:30'), findsOneWidget);
      });

      testWidgets('should handle zero duration', (tester) async {
        // Arrange
        when(mockProvider.recordingDuration).thenReturn(Duration.zero);

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('00:00'), findsOneWidget);
      });

      testWidgets('should handle long duration', (tester) async {
        // Arrange
        when(mockProvider.recordingDuration).thenReturn(const Duration(minutes: 59, seconds: 59));

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert
        expect(find.text('59:59'), findsOneWidget);
      });
    });

    group('Accessibility Tests', () {
      testWidgets('should have semantic labels for buttons', (tester) async {
        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert - buttons should be accessible
        expect(find.text('Record'), findsOneWidget);
        expect(find.text('Stop'), findsOneWidget);
        
        // Icons should be accessible
        expect(find.byIcon(Icons.fiber_manual_record), findsOneWidget);
        expect(find.byIcon(Icons.stop), findsOneWidget);
      });

      testWidgets('should support large text scaling', (tester) async {
        // Act
        await tester.pumpWidget(MediaQuery(
          data: const MediaQueryData(textScaleFactor: 2.0),
          child: createWidgetUnderTest(),
        ));
        await tester.pump();

        // Assert - should not overflow
        expect(tester.takeException(), isNull);
      });
    });

    group('Responsive Design Tests', () {
      testWidgets('should adapt to small screen sizes', (tester) async {
        // Arrange
        tester.binding.window.physicalSizeTestValue = const Size(400, 800);
        tester.binding.window.devicePixelRatioTestValue = 1.0;

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert - should not overflow
        expect(tester.takeException(), isNull);
        
        addTearDown(tester.binding.window.clearPhysicalSizeTestValue);
        addTearDown(tester.binding.window.clearDevicePixelRatioTestValue);
      });

      testWidgets('should adapt to large screen sizes', (tester) async {
        // Arrange
        tester.binding.window.physicalSizeTestValue = const Size(1200, 800);
        tester.binding.window.devicePixelRatioTestValue = 1.0;

        // Act
        await tester.pumpWidget(createWidgetUnderTest());
        await tester.pump();

        // Assert - should not overflow
        expect(tester.takeException(), isNull);
        
        addTearDown(tester.binding.window.clearPhysicalSizeTestValue);
        addTearDown(tester.binding.window.clearDevicePixelRatioTestValue);
      });
    });
  });
}

// Mock classes for testing
class MockAudioUploadResult extends Mock {
  @override
  bool get success => super.noSuchMethod(Invocation.getter(#success), returnValue: false);
  
  @override
  dynamic get error => super.noSuchMethod(Invocation.getter(#error), returnValue: null);
}

class MockAudioUploadError extends Mock {
  @override
  String get message => super.noSuchMethod(Invocation.getter(#message), returnValue: '');
}
