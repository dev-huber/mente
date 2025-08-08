/// Entidade que representa o resultado de uma análise de áudio
class AnalysisResult {
  final String id;
  final DateTime timestamp;
  final String audioPath;
  final Duration audioDuration;
  final bool lieDetected;
  final double confidence;
  final List<String> emotions;
  final double stressLevel;
  final String speechRate;
  final Map<String, dynamic> metadata;

  const AnalysisResult({
    required this.id,
    required this.timestamp,
    required this.audioPath,
    required this.audioDuration,
    required this.lieDetected,
    required this.confidence,
    required this.emotions,
    required this.stressLevel,
    required this.speechRate,
    this.metadata = const {},
  });

  /// Cria uma instância a partir de um Map
  factory AnalysisResult.fromMap(Map<String, dynamic> map) {
    return AnalysisResult(
      id: map['id'] ?? '',
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] ?? 0),
      audioPath: map['audioPath'] ?? '',
      audioDuration: Duration(milliseconds: map['audioDuration'] ?? 0),
      lieDetected: map['lieDetected'] ?? false,
      confidence: (map['confidence'] ?? 0.0).toDouble(),
      emotions: List<String>.from(map['emotions'] ?? []),
      stressLevel: (map['stressLevel'] ?? 0.0).toDouble(),
      speechRate: map['speechRate'] ?? 'normal',
      metadata: Map<String, dynamic>.from(map['metadata'] ?? {}),
    );
  }

  /// Converte para Map
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'timestamp': timestamp.millisecondsSinceEpoch,
      'audioPath': audioPath,
      'audioDuration': audioDuration.inMilliseconds,
      'lieDetected': lieDetected,
      'confidence': confidence,
      'emotions': emotions,
      'stressLevel': stressLevel,
      'speechRate': speechRate,
      'metadata': metadata,
    };
  }

  /// Cria uma cópia com modificações
  AnalysisResult copyWith({
    String? id,
    DateTime? timestamp,
    String? audioPath,
    Duration? audioDuration,
    bool? lieDetected,
    double? confidence,
    List<String>? emotions,
    double? stressLevel,
    String? speechRate,
    Map<String, dynamic>? metadata,
  }) {
    return AnalysisResult(
      id: id ?? this.id,
      timestamp: timestamp ?? this.timestamp,
      audioPath: audioPath ?? this.audioPath,
      audioDuration: audioDuration ?? this.audioDuration,
      lieDetected: lieDetected ?? this.lieDetected,
      confidence: confidence ?? this.confidence,
      emotions: emotions ?? this.emotions,
      stressLevel: stressLevel ?? this.stressLevel,
      speechRate: speechRate ?? this.speechRate,
      metadata: metadata ?? this.metadata,
    );
  }

  @override
  String toString() {
    return 'AnalysisResult(id: $id, lieDetected: $lieDetected, confidence: $confidence)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is AnalysisResult && other.id == id;
  }

  @override
  int get hashCode => id.hashCode;
}
