import 'package:flutter/material.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import 'package:quem_mente_menos/core/theme/app_colors.dart';
import 'package:quem_mente_menos/features/audio/domain/entities/analysis_result.dart';
import 'package:share_plus/share_plus.dart';

class AnalysisResultWidget extends StatefulWidget {
  final AnalysisResult result;
  final VoidCallback onNewRecording;
  
  const AnalysisResultWidget({
    super.key,
    required this.result,
    required this.onNewRecording,
  });
  
  @override
  State<AnalysisResultWidget> createState() => _AnalysisResultWidgetState();
}

class _AnalysisResultWidgetState extends State<AnalysisResultWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 0.5,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    ));
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeIn,
    ));
    
    _animationController.forward();
  }
  
  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Column(
        children: [
          _buildScoreCard(),
          const SizedBox(height: 24),
          _buildDetailsCard(),
          const SizedBox(height: 24),
          _buildKeyIndicators(),
          const SizedBox(height: 24),
          _buildSuggestions(),
          const SizedBox(height: 32),
          _buildActions(),
        ],
      ),
    );
  }
  
  Widget _buildScoreCard() {
    final color = _getScoreColor(widget.result.lieScore);
    final verdict = _getVerdict(widget.result.classification);
    
    return ScaleTransition(
      scale: _scaleAnimation,
      child: Card(
        elevation: 8,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        child: Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                color.withOpacity(0.1),
                color.withOpacity(0.05),
              ],
            ),
          ),
          child: Column(
            children: [
              CircularPercentIndicator(
                radius: 80.0,
                lineWidth: 12.0,
                animation: true,
                animationDuration: 1200,
                percent: widget.result.lieScore / 100,
                center: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      '${widget.result.lieScore.toInt()}%',
                      style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                    ),
                    Text(
                      'Mentira',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                progressColor: color,
                backgroundColor: color.withOpacity(0.2),
                circularStrokeCap: CircularStrokeCap.round,
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: color.withOpacity(0.3)),
                ),
                child: Text(
                  verdict,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: color,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.psychology,
                    size: 16,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Confiança: ${widget.result.confidence.toInt()}%',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildDetailsCard() {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Análise Detalhada',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            _buildDetailRow('Linguística', widget.result.details.linguisticScore),
            const SizedBox(height: 12),
            _buildDetailRow('Vocal', widget.result.details.vocalScore),
            const SizedBox(height: 12),
            _buildDetailRow('Sentimento', widget.result.details.sentimentScore),
            const SizedBox(height: 12),
            _buildDetailRow('Consistência', widget.result.details.consistencyScore),
          ],
        ),
      ),
    );
  }
  
  Widget _buildDetailRow(String label, double score) {
    final color = _getScoreColor(score);
    
    return Row(
      children: [
        SizedBox(
          width: 100,
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
        Expanded(
          child: Stack(
            children: [
              Container(
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.divider,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              FractionallySizedBox(
                widthFactor: score / 100,
                child: Container(
                  height: 8,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Text(
          '${score.toInt()}%',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
      ],
    );
  }
  
  Widget _buildKeyIndicators() {
    if (widget.result.keyIndicators.isEmpty) return const SizedBox.shrink();
    
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.warning_amber_rounded,
                  color: AppColors.warning,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Indicadores Principais',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...widget.result.keyIndicators.map((indicator) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    margin: const EdgeInsets.only(top: 6),
                    width: 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: AppColors.warning,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      indicator,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSuggestions() {
    if (widget.result.suggestions.isEmpty) return const SizedBox.shrink();
    
    return Card(
      color: AppColors.info.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: AppColors.info.withOpacity(0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(
                  Icons.lightbulb_outline,
                  color: AppColors.info,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Text(
                  'Sugestões',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.info,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ...widget.result.suggestions.map((suggestion) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text(
                '• $suggestion',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
            )),
          ],
        ),
      ),
    );
  }
  
  Widget _buildActions() {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: _shareResult,
            icon: const Icon(Icons.share),
            label: const Text('Compartilhar'),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: widget.onNewRecording,
            icon: const Icon(Icons.refresh),
            label: const Text('Nova Análise'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
      ],
    );
  }
  
  Color _getScoreColor(double score) {
    if (score >= 70) return AppColors.error;
    if (score >= 40) return AppColors.warning;
    return AppColors.success;
  }
  
  String _getVerdict(String classification) {
    switch (classification) {
      case 'lie':
        return '🤥 Provável Mentira';
      case 'truth':
        return '✅ Provável Verdade';
      case 'uncertain':
      default:
        return '🤔 Inconclusivo';
    }
  }
  
  void _shareResult() {
    final verdict = _getVerdict(widget.result.classification);
    final text = '''
🎯 Resultado da Análise - Quem Mente Menos?

$verdict
Score de Mentira: ${widget.result.lieScore.toInt()}%
Confiança: ${widget.result.confidence.toInt()}%

${widget.result.explanation}

Baixe o app e descubra quem mente menos!
''';
    
    Share.share(text);
  }
}
