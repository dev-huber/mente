import 'package:flutter/material.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:share_plus/share_plus.dart';
import '../core/theme/app_colors.dart';
import '../providers/audio_capture_provider.dart';

class AnalysisResultWidget extends StatelessWidget {
  final AnalysisResult result;
  
  const AnalysisResultWidget({
    super.key,
    required this.result,
  });
  
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Título
          Text(
            'Resultado da Análise',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Indicador circular principal
          CircularPercentIndicator(
            radius: 80,
            lineWidth: 12,
            percent: result.lieDetectionScore,
            center: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${(result.lieDetectionScore * 100).toInt()}%',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: _getScoreColor(result.lieDetectionScore),
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Confiança',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            progressColor: _getScoreColor(result.lieDetectionScore),
            backgroundColor: AppColors.background,
            circularStrokeCap: CircularStrokeCap.round,
          ),
          
          const SizedBox(height: 24),
          
          // Nível de confiança
          _buildConfidenceIndicator(),
          
          const SizedBox(height: 32),
          
          // Detalhes da análise
          _buildAnalysisDetails(),
          
          const SizedBox(height: 24),
          
          // Botões de ação
          _buildActionButtons(context),
        ],
      ),
    );
  }
  
  Widget _buildConfidenceIndicator() {
    final confidence = result.confidence.toLowerCase();
    final confidenceColor = _getConfidenceColor(confidence);
    final confidenceText = _getConfidenceText(confidence);
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: confidenceColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: confidenceColor, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getConfidenceIcon(confidence),
            size: 16,
            color: confidenceColor,
          ),
          const SizedBox(width: 8),
          Text(
            confidenceText,
            style: TextStyle(
              color: confidenceColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildAnalysisDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Detalhes da Análise',
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        
        const SizedBox(height: 16),
        
        if (result.details['speechRate'] != null)
          _buildDetailRow(
            'Taxa de Fala',
            '${result.details['speechRate'].toStringAsFixed(0)} palavras/min',
            Icons.speed,
          ),
        
        if (result.details['pauseDuration'] != null)
          _buildDetailRow(
            'Duração de Pausas',
            '${result.details['pauseDuration'].toStringAsFixed(1)}s',
            Icons.pause,
          ),
        
        if (result.details['voiceTremor'] != null)
          _buildDetailRow(
            'Tremor na Voz',
            result.details['voiceTremor'] ? 'Detectado' : 'Não detectado',
            Icons.graphic_eq,
          ),
        
        if (result.details['stressLevel'] != null)
          _buildDetailRow(
            'Nível de Stress',
            '${(result.details['stressLevel'] * 100).toInt()}%',
            Icons.psychology,
          ),
      ],
    );
  }
  
  Widget _buildDetailRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: AppColors.primary,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: const TextStyle(
                color: AppColors.textSecondary,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildActionButtons(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => _shareResult(),
            icon: const Icon(Icons.share),
            label: const Text('Compartilhar'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => _saveResult(),
            icon: const Icon(Icons.save),
            label: const Text('Salvar'),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.primary,
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
      ],
    );
  }
  
  Color _getScoreColor(double score) {
    if (score < 0.3) return AppColors.success;
    if (score < 0.7) return AppColors.warning;
    return AppColors.error;
  }
  
  Color _getConfidenceColor(String confidence) {
    switch (confidence) {
      case 'high':
        return AppColors.success;
      case 'medium':
        return AppColors.warning;
      case 'low':
        return AppColors.error;
      default:
        return AppColors.textSecondary;
    }
  }
  
  String _getConfidenceText(String confidence) {
    switch (confidence) {
      case 'high':
        return 'Alta Confiança';
      case 'medium':
        return 'Média Confiança';
      case 'low':
        return 'Baixa Confiança';
      default:
        return 'Desconhecido';
    }
  }
  
  IconData _getConfidenceIcon(String confidence) {
    switch (confidence) {
      case 'high':
        return Icons.check_circle;
      case 'medium':
        return Icons.warning;
      case 'low':
        return Icons.error;
      default:
        return Icons.help;
    }
  }
  
  void _shareResult() {
    final scoreText = '${(result.lieDetectionScore * 100).toInt()}%';
    final confidenceText = _getConfidenceText(result.confidence.toLowerCase());
    
    Share.share(
      'Resultado da Análise de Detecção de Mentiras:\n\n'
      'Confiança: $scoreText\n'
      'Nível: $confidenceText\n'
      'Data: ${result.timestamp.day}/${result.timestamp.month}/${result.timestamp.year}\n\n'
      'Gerado pelo app Quem Mente Menos?',
    );
  }
  
  void _saveResult() {
    // Implementar salvamento local
    // Pode usar shared_preferences ou sqlite
  }
}
