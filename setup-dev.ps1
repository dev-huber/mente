# =================================================================
# SCRIPT DE SETUP RÁPIDO - QUEM MENTE MENOS
# Configura ambiente de desenvolvimento em segundos
# =================================================================

Write-Host "🚀 INICIANDO SETUP DE DESENVOLVIMENTO..." -ForegroundColor Green
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "pubspec.yaml")) {
    Write-Host "❌ Execute este script na raiz do projeto (onde está pubspec.yaml)" -ForegroundColor Red
    exit 1
}

Write-Host "📁 Configurando Backend..." -ForegroundColor Yellow

# Navegar para backend
Set-Location backend

# Verificar se Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js detectado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale Node.js 18+ primeiro." -ForegroundColor Red
    exit 1
}

# Instalar dependências do backend
Write-Host "📦 Instalando dependências do backend..."
npm install

# Criar arquivo .env se não existir
if (-not (Test-Path ".env")) {
    Write-Host "📝 Criando arquivo .env..."
    Copy-Item "env.example" ".env"
    
    Write-Host ""
    Write-Host "⚠️  ATENÇÃO: Configure suas chaves Azure no arquivo backend/.env" -ForegroundColor Yellow
    Write-Host "   Edite o arquivo backend/.env com suas chaves reais do Azure" -ForegroundColor Yellow
    Write-Host ""
} else {
    Write-Host "✅ Arquivo .env já existe" -ForegroundColor Green
}

# Voltar para raiz
Set-Location ..

Write-Host "📱 Configurando Flutter..." -ForegroundColor Yellow

# Verificar se Flutter está instalado
try {
    $flutterVersion = flutter --version | Select-String "Flutter"
    Write-Host "✅ Flutter detectado: $($flutterVersion.Line)" -ForegroundColor Green
} catch {
    Write-Host "❌ Flutter não encontrado. Instale Flutter primeiro." -ForegroundColor Red
    exit 1
}

# Instalar dependências do Flutter
Write-Host "📦 Instalando dependências do Flutter..."
flutter pub get

Write-Host ""
Write-Host "🎉 SETUP CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Configure suas chaves Azure em backend/.env" -ForegroundColor White
Write-Host "2. Inicie o backend: cd backend && npm start" -ForegroundColor White
Write-Host "3. Em outro terminal, inicie o Flutter: flutter run" -ForegroundColor White
Write-Host ""
Write-Host "🔧 COMANDOS ÚTEIS:" -ForegroundColor Cyan
Write-Host "- Testar backend: cd backend && npm test" -ForegroundColor White
Write-Host "- Health check: http://localhost:7071/api/health" -ForegroundColor White
Write-Host "- Ver logs: cd backend && npm run logs" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentação completa em: docs/project_status.md" -ForegroundColor White