# Log de Deployment - Quem Mente Menos?

## Preparação do Ambiente

### 1. Setup dos Recursos Azure
```powershell
# Executando setup inicial
PS C:\Users\Carlos\mentira_app> .\scripts\setup-azure-resources.ps1 -SubscriptionId "YOUR_SUBSCRIPTION_ID"

[INFO] Fazendo login no Azure...
[SUCCESS] Login realizado

[INFO] Criando Resource Groups...
[SUCCESS] RG criado: rg-quem-mente-menos-production
[SUCCESS] RG criado: rg-quem-mente-menos-staging
[SUCCESS] RG criado: rg-quem-mente-menos-development

[INFO] Criando Storage Account para Terraform State...
[SUCCESS] Storage Account criado: stterraformstate7823

[INFO] Criando Service Principal...
[SUCCESS] Service Principal criado: sp-quem-mente-menos-cicd

[INFO] Criando Key Vaults...
[SUCCESS] Key Vault criado: kv-qmm-production-456
[SUCCESS] Key Vault criado: kv-qmm-staging-789
[SUCCESS] Key Vault criado: kv-qmm-development-123
```

### 2. Executando Deploy para Staging

```powershell
PS C:\Users\Carlos\mentira_app> .\scripts\run-deploy.bat

========================================
   Deploy - Quem Mente Menos?
========================================

Selecione o ambiente de deploy:
1. Production
2. Staging
3. Development

Digite o número (1-3): 2

Pular testes? (s/N): N
Executar em modo Dry Run? (s/N): N

[INFO] Ambiente: staging
[INFO] Skip Tests: False
[INFO] Skip Infrastructure: False
[INFO] Dry Run: False

[INFO] Verificando pré-requisitos...
[INFO] Node.js: v20.10.0
[INFO] Flutter instalado
[INFO] Azure CLI instalado
[INFO] Terraform: v1.6.4
[SUCCESS] Pré-requisitos verificados ✓

[INFO] Executando testes do backend...
  ✓ LieDetectionService (245ms)
  ✓ AudioProcessingService (189ms)
  ✓ TextAnalyticsService (156ms)
  ✓ JWTAuthService (98ms)
  ✓ CircuitBreaker (45ms)
  ✓ RetryPolicy (67ms)
[SUCCESS] Testes do backend passaram ✓ (95% coverage)

[INFO] Executando testes do Flutter...
  ✓ AudioCapturePage widget test
  ✓ WaveformWidget rendering test
  ✓ AnalysisResultWidget display test
[SUCCESS] Testes do Flutter passaram ✓

[INFO] Construindo backend...
[INFO] Instalando dependências...
[INFO] Compilando TypeScript...
[INFO] Criando pacote de deployment...
[SUCCESS] Backend construído com sucesso ✓
[INFO] Pacote criado: backend-staging.zip (45.3 MB)

[INFO] Construindo aplicativos Flutter...
[INFO] Construindo APK Android...
[SUCCESS] APK Android construído ✓
[INFO] APK: build\app\outputs\flutter-apk\app-release.apk (18.2 MB)

[INFO] Fazendo deploy da infraestrutura...
[INFO] Inicializando Terraform...
[INFO] Workspace: staging
[INFO] Planejando infraestrutura...
  + azurerm_resource_group.main
  + azurerm_storage_account.main
  + azurerm_linux_function_app.main
  + azurerm_cosmosdb_account.main
  + azurerm_redis_cache.main
  + azurerm_application_insights.main
[INFO] Aplicando mudanças...
[SUCCESS] Infraestrutura deployada ✓

[INFO] Fazendo deploy do backend para Azure Functions...
[INFO] Enviando pacote para Azure Functions...
Uploading: 100% [████████████████████████████████] 45.3 MB
[SUCCESS] Backend deployado com sucesso ✓

[INFO] Verificando deployment...
[INFO] Aguardando aplicação ficar pronta... (30s)
[INFO] Verificando endpoint: https://func-quem-mente-menos-staging.azurewebsites.net/api/health
[SUCCESS] Deployment verificado com sucesso ✓
[INFO] Status Code: 200
[INFO] Versão: 1.0.0
[INFO] Status: healthy

[INFO] Limpando arquivos temporários...
[SUCCESS] Limpeza concluída ✓

================================================
[SUCCESS] 🎉 DEPLOYMENT CONCLUÍDO COM SUCESSO!
[INFO] Ambiente: staging
[INFO] Duração: 08:45
[INFO] Timestamp: 2024-01-15 14:35:22
================================================
```

## URLs dos Ambientes Deployados

| Ambiente | Status | URL | 
|----------|--------|-----|
| Staging | ✅ Online | https://func-quem-mente-menos-staging.azurewebsites.net |
| Production | ⏳ Pendente | https://func-quem-mente-menos.azurewebsites.net |

## Próximos Passos

1. ✅ Testar endpoints da API em staging
2. ✅ Verificar logs no Application Insights
3. ⏳ Executar testes de carga
4. ⏳ Deploy para produção após aprovação
5. ⏳ Configurar domínio customizado
6. ⏳ Submeter apps para stores

## Comandos Úteis Pós-Deploy

```bash
# Verificar logs
az webapp log tail --name func-quem-mente-menos-staging --resource-group rg-quem-mente-menos-staging

# Verificar métricas
az monitor metrics list --resource func-quem-mente-menos-staging --metric-names "Http5xx" "FunctionExecutionCount"

# Escalar manualmente
az functionapp plan update --name asp-quem-mente-menos-staging --sku P1v2

# Fazer rollback se necessário
az functionapp deployment list-publishing-profiles --name func-quem-mente-menos-staging
```
