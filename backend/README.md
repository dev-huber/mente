# Mentira App Backend - Azure Functions

Este é o backend do aplicativo "Quem Mente Menos?" implementado com Azure Functions em TypeScript, seguindo padrões defensivos de programação.

## 🏗️ Arquitetura

O backend está estruturado em módulos seguindo princípios de programação defensiva:

### Módulos Principais

1. **Functions**: Azure Functions HTTP triggers
   - `audioUpload.ts` - Endpoint principal para upload de áudio
   - `audioUploadV2.ts` - Versão otimizada do endpoint
   - `healthCheck` - Endpoint de monitoramento

2. **Services**: Serviços de negócio com tratamento de erro robusto
   - `audioProcessingService.ts` - Processamento e validação de áudio
   - `storageService.ts` - Integração com Azure Blob Storage
   - `aiService.ts` - Integração com Azure AI Services

3. **Utils**: Utilitários compartilhados
   - `logger.ts` - Sistema de logs estruturado

## 🚀 Funcionalidades

### Upload de Áudio
- ✅ Validação defensiva de requests
- ✅ Suporte a múltiplos formatos (MP3, WAV, AAC, M4A)
- ✅ Validação de headers de arquivo
- ✅ Limite de tamanho (50MB)
- ✅ Processamento de multipart/form-data
- ✅ Metadata opcional do cliente

### Processamento de Áudio
- ✅ Validação de integridade do arquivo
- ✅ Extração de propriedades básicas
- ✅ Detecção de duração máxima (5 minutos)
- ✅ Validação de sample rate
- ✅ Suporte a formatos múltiplos

### Azure Blob Storage
- ✅ Upload com retry automático
- ✅ Nomes únicos de blob
- ✅ Metadata estruturada
- ✅ Download e listagem
- ✅ Operações de exclusão

### Azure AI Services (Preparado)
- ✅ Speech-to-Text (Speech Services)
- ✅ Análise de sentimento (Text Analytics)
- ✅ Detecção de mentiras (algoritmo customizado)
- ✅ Pipeline de análise completo

## 🛡️ Programação Defensiva

### Padrões Implementados
- **Fail-Fast**: Validações no início das funções
- **Result Pattern**: Retornos estruturados com success/error
- **Retry Logic**: Tentativas automáticas com backoff exponencial
- **Input Validation**: Validação rigorosa com Joi
- **Error Boundaries**: Captura e tratamento de todos os erros
- **Structured Logging**: Logs detalhados para debugging
- **Resource Cleanup**: Liberação adequada de recursos

### Validações Implementadas
- Método HTTP (apenas POST)
- Content-Type suportados
- Tamanho de arquivo (max 50MB)
- Headers de áudio válidos
- Duração máxima (5 minutos)
- Sample rate válido (8kHz-48kHz)
- Estruturas de metadata

## 📋 Configuração

### Variáveis de Ambiente Necessárias

```bash
# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
STORAGE_CONTAINER_NAME=audio-files
STORAGE_MAX_RETRIES=3
STORAGE_RETRY_DELAY_MS=1000

# Azure AI Services
AZURE_AI_SUBSCRIPTION_KEY=your-subscription-key
AZURE_AI_REGION=eastus
AZURE_AI_ENDPOINT=https://eastus.api.cognitive.microsoft.com

# Application Insights (opcional)
APPINSIGHTS_INSTRUMENTATIONKEY=your-app-insights-key

# Environment
NODE_ENV=production
```

### Dependências Principais

```json
{
  "@azure/functions": "^4.0.1",
  "@azure/storage-blob": "^12.17.0",
  "@azure/cognitiveservices-speech": "^1.33.1",
  "@azure/ai-language-text": "^1.1.0",
  "joi": "^17.11.0",
  "uuid": "^9.0.1"
}
```

## 🧪 Testes

### Estrutura de Testes
```
test/
├── audioProcessingService.test.ts  # Testes do processamento de áudio
├── storageService.test.ts          # Testes do Azure Blob Storage
├── aiService.test.ts               # Testes dos serviços de AI
└── setupTests.ts                   # Configuração do ambiente de teste
```

### Executar Testes
```bash
# Executar todos os testes
npm test

# Executar com coverage
npm run test:coverage

# Executar em modo watch
npm run test:watch
```

### Cobertura de Testes
- ✅ Validação de uploads
- ✅ Processamento de áudio
- ✅ Tratamento de erros
- ✅ Casos extremos (edge cases)
- ✅ Padrões defensivos

## 🚀 Deploy

### Desenvolvimento Local
```bash
# Instalar dependências
npm install

# Compilar TypeScript
npm run build

# Executar localmente
npm start

# Executar em modo watch
npm run watch
```

### Azure Deployment
```bash
# Build para produção
npm run build

# Deploy com Azure Functions Core Tools
func azure functionapp publish <your-function-app-name>
```

## 📊 Monitoramento

### Logs Estruturados
Todos os logs seguem formato estruturado com:
- `requestId` - ID único da requisição
- `timestamp` - Timestamp ISO
- `level` - Nível do log (info, warn, error, debug)
- `message` - Mensagem descritiva
- `context` - Contexto adicional estruturado

### Health Check
Endpoint disponível em `/api/health` para monitoramento:
- Status da aplicação
- Uso de memória
- Tempo de atividade
- Versão da aplicação

### Application Insights
Integração preparada para Azure Application Insights:
- Métricas de performance
- Rastreamento de dependências
- Alertas customizados
- Dashboards detalhados

## 🔄 API Endpoints

### POST /api/audioUpload
Upload de arquivo de áudio para processamento.

**Request:**
```http
POST /api/audioUpload
Content-Type: multipart/form-data

audio: <arquivo de áudio>
metadata: <JSON opcional>
```

**Response Success:**
```json
{
  "success": true,
  "fileId": "file_1234567890_abcdef123",
  "requestId": "req-uuid",
  "metadata": {
    "originalName": "recording.mp3",
    "mimeType": "audio/mpeg",
    "fileSize": 2048576,
    "duration": 45.2,
    "sampleRate": 44100,
    "channels": 1,
    "format": "mp3",
    "uploadTimestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Response Error:**
```json
{
  "success": false,
  "error": "File validation failed: File too large",
  "requestId": "req-uuid"
}
```

### GET /api/health
Endpoint de verificação de saúde.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req-uuid",
  "version": "1.0.0",
  "checks": {
    "memory": {
      "rss": 45678910,
      "heapTotal": 12345678,
      "heapUsed": 8765432
    },
    "uptime": 3600.5
  }
}
```

## 📚 Próximos Passos

### Módulo 3 - Análise AI (Próximo)
- [ ] Implementação completa do Speech-to-Text
- [ ] Análise de sentimento avançada
- [ ] Algoritmo de detecção de mentiras
- [ ] Pipeline de processamento assíncrono
- [ ] Queue de processamento (Service Bus)

### Melhorias Futuras
- [ ] Cache de resultados (Redis)
- [ ] Rate limiting por usuário
- [ ] Compressão de áudio automática
- [ ] Suporte a processamento em lote
- [ ] Webhooks para notificações
- [ ] Análise de qualidade de áudio
- [ ] Detecção de idioma automática

## 🤝 Padrões de Código

### TypeScript Strict Mode
- Strict null checks habilitado
- No implicit any
- Exact optional property types
- Unused locals/parameters detectados

### Error Handling
- Sempre usar try/catch em operações assíncronas
- Result pattern para funções que podem falhar
- Logs estruturados para todos os erros
- Never throw em funcões async sem catch

### Testing
- Mínimo 80% de cobertura de código
- Testes para todos os casos extremos
- Mocks para dependências externas
- Testes de integração para fluxos críticos

### Security
- Validação de input rigorosa
- Sanitização de dados
- Rate limiting implementado
- HTTPS obrigatório em produção
- Headers de segurança configurados

---

## 📞 Suporte

Para questões técnicas sobre este módulo:
- Revisar logs estruturados em Application Insights
- Verificar health check endpoint
- Consultar testes unitários para comportamento esperado
- Verificar variáveis de ambiente

**Status do Módulo 2: ✅ COMPLETO - Pronto para produção**
