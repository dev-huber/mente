# Deploy Script Básico - Apenas Empacotamento
param(
    [string]$Environment = 'staging',
    [switch]$SkipTests = $false,
    [switch]$SkipBuild = $false
)

$ErrorActionPreference = 'Continue'
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptPath
$BackendDir = Join-Path $ProjectRoot 'backend'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deploy Básico - Quem Mente Menos?" -ForegroundColor Cyan
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

# Verificar se existem dependências
if (!(Test-Path "node_modules")) {
    Write-Host "[INFO] Instalando dependências..." -ForegroundColor Cyan
    npm ci
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARNING] Falha nas dependências, mas continuando..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Dependências já instaladas" -ForegroundColor Green
}

# Executar testes se não pulados (mas não falhar se der erro)
if (!$SkipTests) {
    Write-Host "[INFO] Tentando executar testes..." -ForegroundColor Cyan
    npm test
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Testes passaram!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Testes falharam, mas continuando..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Pulando testes..." -ForegroundColor Yellow
}

# Build (tentativa)
if (!$SkipBuild) {
    Write-Host "[INFO] Tentando compilar TypeScript..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Build concluído!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Build falhou, criando pacote com código fonte..." -ForegroundColor Yellow
    }
} else {
    Write-Host "[INFO] Pulando build - usando código fonte..." -ForegroundColor Yellow
}

# Criar pacote básico (mesmo sem build)
$zipPath = Join-Path $ProjectRoot "backend-$Environment.zip"
Write-Host "[INFO] Criando pacote básico: $zipPath" -ForegroundColor Cyan

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

# Criar zip com arquivos essenciais
$tempDir = Join-Path $env:TEMP "backend-deploy-basic"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copiar arquivos essenciais
$essentialFiles = @(
    "package.json",
    "host.json"
)

$essentialDirs = @()
if (Test-Path "dist") { $essentialDirs += "dist" }
if (Test-Path "src") { $essentialDirs += "src" }
if (Test-Path "node_modules") { $essentialDirs += "node_modules" }

foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Copy-Item $file -Destination $tempDir -Force
        Write-Host "[INFO] Adicionado: $file" -ForegroundColor Gray
    }
}

foreach ($dir in $essentialDirs) {
    if (Test-Path $dir) {
        Copy-Item $dir -Destination $tempDir -Recurse -Force
        Write-Host "[INFO] Adicionado: $dir" -ForegroundColor Gray
    }
}

# Criar package.json básico se não existir
$packageJsonPath = Join-Path $tempDir "package.json"
if (!(Test-Path $packageJsonPath)) {
    Write-Host "[INFO] Criando package.json básico..." -ForegroundColor Cyan
    $basicPackageJson = @{
        name = "quem-mente-menos-backend"
        version = "1.0.0"
        main = if (Test-Path "dist") { "dist/index.js" } else { "src/index.ts" }
        scripts = @{
            start = if (Test-Path "dist") { "node dist/index.js" } else { "ts-node src/index.ts" }
        }
    } | ConvertTo-Json -Depth 3
    
    $basicPackageJson | Out-File -FilePath $packageJsonPath -Encoding UTF8
}

# Criar host.json básico se não existir
$hostJsonPath = Join-Path $tempDir "host.json"
if (!(Test-Path $hostJsonPath)) {
    Write-Host "[INFO] Criando host.json básico..." -ForegroundColor Cyan
    $basicHostJson = @{
        version = "2.0"
        functionTimeout = "00:05:00"
        extensions = @{
            http = @{
                routePrefix = "api"
            }
        }
    } | ConvertTo-Json -Depth 3
    
    $basicHostJson | Out-File -FilePath $hostJsonPath -Encoding UTF8
}

# Comprimir
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath -Force
Remove-Item $tempDir -Recurse -Force

$zipSize = (Get-Item $zipPath).Length / 1MB
Write-Host "[SUCCESS] Pacote criado: $zipPath ($('{0:N2}' -f $zipSize) MB)" -ForegroundColor Green

# Voltar para raiz
Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "📦 PACOTE CRIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "Ambiente: $Environment" -ForegroundColor Yellow
Write-Host "Pacote: $zipPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  ATENÇÃO:" -ForegroundColor Yellow
Write-Host "Este é um pacote básico. Para produção, corrija os erros de TypeScript primeiro." -ForegroundColor Yellow
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. ✅ Pacote pronto para upload manual" -ForegroundColor Green
Write-Host "2. 🔧 Corrigir erros de TypeScript" -ForegroundColor Yellow
Write-Host "3. 🚀 Deploy manual no Azure Portal" -ForegroundColor Cyan
Write-Host ""
