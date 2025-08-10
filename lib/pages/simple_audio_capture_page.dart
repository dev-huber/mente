import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/simple_audio_provider.dart';

class AudioCapturePage extends ConsumerWidget {
  const AudioCapturePage({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final audioState = ref.watch(audioProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quem Mente Menos?'),
        backgroundColor: Colors.deepPurple,
        foregroundColor: Colors.white,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.mic,
              size: 100,
              color: Colors.deepPurple,
            ),
            const SizedBox(height: 32),
            Text(
              'Estado: ${_getStateText(audioState.state)}',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            Text(
              'Duração: ${_formatDuration(audioState.duration)}',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 32),
            if (audioState.errorMessage != null)
              Container(
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: Colors.red.shade100,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red),
                ),
                child: Text(
                  'Erro: ${audioState.errorMessage}',
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            const SizedBox(height: 32),
            Wrap(
              spacing: 16,
              children: [
                ElevatedButton.icon(
                  onPressed: audioState.state == AudioState.idle || audioState.state == AudioState.stopped
                      ? () => ref.read(audioProvider.notifier).startRecording()
                      : null,
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Iniciar'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: audioState.state == AudioState.recording
                      ? () => ref.read(audioProvider.notifier).pauseRecording()
                      : null,
                  icon: const Icon(Icons.pause),
                  label: const Text('Pausar'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: audioState.state == AudioState.paused
                      ? () => ref.read(audioProvider.notifier).resumeRecording()
                      : null,
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('Continuar'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                ),
                ElevatedButton.icon(
                  onPressed: audioState.state == AudioState.recording || audioState.state == AudioState.paused
                      ? () => ref.read(audioProvider.notifier).stopRecording()
                      : null,
                  icon: const Icon(Icons.stop),
                  label: const Text('Parar'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.red,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            const Text(
              'Aplicativo para detecção de mentiras com IA',
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getStateText(AudioState state) {
    switch (state) {
      case AudioState.idle:
        return 'Pronto';
      case AudioState.recording:
        return 'Gravando';
      case AudioState.paused:
        return 'Pausado';
      case AudioState.stopped:
        return 'Parado';
      case AudioState.uploading:
        return 'Enviando';
      case AudioState.error:
        return 'Erro';
    }
  }

  String _formatDuration(Duration duration) {
    String twoDigits(int n) => n.toString().padLeft(2, '0');
    String twoDigitMinutes = twoDigits(duration.inMinutes.remainder(60));
    String twoDigitSeconds = twoDigits(duration.inSeconds.remainder(60));
    return '${twoDigits(duration.inHours)}:$twoDigitMinutes:$twoDigitSeconds';
  }
}
