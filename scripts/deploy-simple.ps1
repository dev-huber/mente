# Deploy Script Simples - Quem Mente Menos?
param(
    [string]$Environment = 'staging',
    [switch]$SkipTests = $false,
    [switch]$BackendOnly = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = 'Continue'
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptPath
$BackendDir = Join-Path $ProjectRoot 'backend'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy Simples - Quem Mente Menos?" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Ambiente: $Environment" -ForegroundColor Yellow
Write-Host ""

# Verificar Node.js
Write-Host "[INFO] Verificando Node.js..." -ForegroundColor Cyan
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[ERRO] Node.js não está instalado!" -ForegroundColor Red
    exit 1
}

$nodeVersion = node --version
Write-Host "[SUCCESS] Node.js: $nodeVersion" -ForegroundColor Green

# Ir para pasta backend
Write-Host "[INFO] Entrando na pasta backend..." -ForegroundColor Cyan
Set-Location $BackendDir

# Instalar dependências
Write-Host "[INFO] Instalando dependências..." -ForegroundColor Cyan
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha ao instalar dependências!" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Dependências instaladas" -ForegroundColor Green

# Executar testes se não pulados
if (!$SkipTests) {
    Write-Host "[INFO] Executando testes..." -ForegroundColor Cyan
    npm test
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Testes passaram!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Testes falharam, mas continuando..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Pulando testes..." -ForegroundColor Yellow
}

# Build
Write-Host "[INFO] Compilando TypeScript..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Falha no build!" -ForegroundColor Red
    exit 1
}

Write-Host "[SUCCESS] Build concluído!" -ForegroundColor Green

# Criar pacote zip
$zipPath = Join-Path $ProjectRoot "backend-$Environment.zip"
Write-Host "[INFO] Criando pacote: $zipPath" -ForegroundColor Cyan

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Criar zip com conteúdo essencial
$filesToZip = @(
    "dist",
    "node_modules", 
    "package.json",
    "host.json"
)

$tempDir = Join-Path $env:TEMP "backend-deploy"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

foreach ($item in $filesToZip) {
    if (Test-Path $item) {
        Copy-Item $item -Destination $tempDir -Recurse -Force
        Write-Host "[INFO] Adicionado ao pacote: $item" -ForegroundColor Gray
    }
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
Remove-Item $tempDir -Recurse -Force

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "[SUCCESS] Pacote criado: $zipPath ($('{0:N2}' -f $zipSize) MB)" -ForegroundColor Green

# Voltar para raiz do projeto
Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 BUILD CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Ambiente: $Environment" -ForegroundColor Yellow
Write-Host "Pacote: $zipPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Verificar o pacote criado" -ForegroundColor White
Write-Host "2. Fazer upload para Azure Functions" -ForegroundColor White
Write-Host "3. Testar endpoints após deploy" -ForegroundColor White
Write-Host ""
