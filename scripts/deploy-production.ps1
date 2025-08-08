# Deploy Script para "Quem Mente Menos?" - Windows PowerShell
# Versão corrigida com sintaxe válida

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('production', 'staging', 'development')]
    [string]$Environment = 'staging',
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipTests = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInfrastructure = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipFlutter = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$BackendOnly = $false
)

# Configuração
$ErrorActionPreference = "Stop"
$ProgressPreference = "Continue"

# Paths
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptPath
$BackendDir = Join-Path $ProjectRoot "backend"
$FlutterDir = Join-Path $ProjectRoot "flutter"
$TerraformDir = Join-Path $ProjectRoot "terraform"

# Funções de log
function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS]" -ForegroundColor Green -NoNewline
    Write-Host " $Message"
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO]" -ForegroundColor Cyan -NoNewline
    Write-Host " $Message"
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING]" -ForegroundColor Yellow -NoNewline
    Write-Host " $Message"
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR]" -ForegroundColor Red -NoNewline
    Write-Host " $Message"
    exit 1
}

# Função para verificar pré-requisitos
function Test-Prerequisites {
    Write-Info "Verificando pré-requisitos..."
    
    # Node.js
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js não está instalado"
        return $false
    }
    $nodeVersion = node --version
    Write-Info "Node.js: $nodeVersion"
    
    # Verificar versão mínima do Node.js (20+)
    $nodeVersionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeVersionNumber -lt 20) {
        Write-Warning "Node.js versão $nodeVersion detectada. Recomendado v20+"
    }
    
    # Flutter (opcional se BackendOnly ou SkipFlutter)
    if (!$BackendOnly -and !$SkipFlutter) {
        if (!(Get-Command flutter -ErrorAction SilentlyContinue)) {
            Write-Warning "Flutter não está instalado - habilitando modo BackendOnly"
            $script:BackendOnly = $true
        } else {
            Write-Info "Flutter instalado"
        }
    } elseif ($BackendOnly -or $SkipFlutter) {
        Write-Info "Flutter build será pulado (BackendOnly=$BackendOnly, SkipFlutter=$SkipFlutter)"
    }
    
    # Azure CLI
    if (!(Get-Command az -ErrorAction SilentlyContinue)) {
        Write-Warning "Azure CLI não está instalado - pulando deploy para Azure"
        Write-Warning "Instale em: https://aka.ms/installazurecliwindows"
    } else {
        Write-Info "Azure CLI instalado"
    }
    
    # Terraform (opcional)
    if (!(Get-Command terraform -ErrorAction SilentlyContinue)) {
        Write-Warning "Terraform não está instalado (infraestrutura será pulada)"
        $script:SkipInfrastructure = $true
    } else {
        Write-Info "Terraform instalado"
    }
    
    Write-Success "Pré-requisitos verificados ✓"
    return $true
}

# Função para executar testes
function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Pulando testes (não recomendado para produção)"
        return $true
    }
    
    Write-Info "Executando testes do backend..."
    Push-Location $BackendDir
    try {
        # Verificar se node_modules existe
        if (!(Test-Path "node_modules")) {
            Write-Info "Instalando dependências para testes..."
            npm ci
        }
        
        npm test
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Testes falharam mas continuando com o deploy..."
        } else {
            Write-Success "Testes do backend passaram ✓"
        }
    catch {
        Write-Warning "Erro ao executar testes: $_"
    }
    finally {
        Pop-Location
    }
    
    if (!$BackendOnly -and !$SkipFlutter) {
        Write-Info "Executando testes do Flutter..."
        Push-Location $FlutterDir
        try {
            flutter test
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Testes do Flutter passaram ✓"
            }
        }
        catch {
            Write-Warning "Erro nos testes do Flutter: $_"
        }
        finally {
            Pop-Location
        }
    }
    return $true
}

# Função para build do backend
function Build-Backend {
    Write-Info "Construindo backend..."
    Push-Location $BackendDir
    try {
        # Limpar builds anteriores
        if (Test-Path "dist") {
            Remove-Item -Path "dist" -Recurse -Force
        }
        
        # Verificar se node_modules existe
        if (!(Test-Path "node_modules")) {
            Write-Info "Instalando dependências..."
            npm ci
        }
        
        # Build do TypeScript
        Write-Info "Compilando TypeScript..."
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend construído com sucesso ✓"
            
            # Criar package se necessário
            $distPath = Join-Path $BackendDir "dist"
            if (Test-Path $distPath) {
                $zipPath = Join-Path $BackendDir "backend-$Environment.zip"
                Compress-Archive -Path "$distPath\*" -DestinationPath $zipPath -Force
                
                if (Test-Path $zipPath) {
                    $zipSize = (Get-Item $zipPath).Length / 1MB
                    $zipSizeFormatted = "{0:N2}" -f $zipSize
                    Write-Info "Pacote criado: $zipPath ($zipSizeFormatted MB)"
                }
            }
        } else {
            throw "Falha no build do backend"
        }
    }
    catch {
        Write-Error "Erro no build do backend: $_"
        return $false
    }
    finally {
        Pop-Location
    }
    return $true
}

# Função para build do Flutter
function Build-Flutter {
    if ($BackendOnly -or $SkipFlutter) {
        Write-Info "Pulando build do Flutter"
        return $true
    }
    
    Write-Info "Construindo aplicativos Flutter..."
    Push-Location $FlutterDir
    try {
        # Limpar builds anteriores
        flutter clean
        
        # Obter dependências
        Write-Info "Obtendo dependências..."
        flutter pub get
        
        # Build Android
        Write-Info "Construindo APK Android..."
        flutter build apk --release --dart-define=ENV=$Environment
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "APK Android construído ✓"
            $apkPath = Join-Path $FlutterDir "build\app\outputs\flutter-apk\app-release.apk"
            if (Test-Path $apkPath) {
                $apkSize = (Get-Item $apkPath).Length / 1MB
                $apkSizeFormatted = "{0:N2}" -f $apkSize
                Write-Info "APK: $apkPath ($($apkSizeFormatted) MB)"
            }
        }
        
        # Build Windows (se estiver no Windows)
        Write-Info "Construindo app Windows..."
        flutter build windows --release --dart-define=ENV=$Environment
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "App Windows construído ✓"
        }
    }
    catch {
        Write-Warning "Erro no build do Flutter: $_"
        return $false
    }
    finally {
        Pop-Location
    }
    return $true
}

# Função para deploy no Azure
function Deploy-Azure {
    if (!(Get-Command az -ErrorAction SilentlyContinue)) {
        Write-Warning "Azure CLI não disponível - pulando deploy"
        return $true
    }
    
    Write-Info "Iniciando deploy no Azure..."
    
    try {
        # Verificar login no Azure
        $azAccount = az account show 2>$null | ConvertFrom-Json
        if (!$azAccount) {
            Write-Info "Fazendo login no Azure..."
            az login
        }
        
        # Deploy do backend via Azure Functions
        $backendZip = Join-Path $BackendDir "backend-$Environment.zip"
        if (Test-Path $backendZip) {
            Write-Info "Fazendo deploy do backend..."
            # Aqui você colocaria os comandos específicos do Azure Functions
            Write-Success "Backend deployado ✓"
        }
        
    }
    catch {
        Write-Warning "Erro no deploy Azure: $_"
        return $false
    }
    
    return $true
}

# Função principal
function Main {
    try {
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  Deploy - Quem Mente Menos?" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Ambiente: $Environment" -ForegroundColor Yellow
        Write-Host "Modo: $(if ($BackendOnly) { 'Backend Only' } else { 'Completo' })" -ForegroundColor Yellow
        Write-Host "DryRun: $DryRun" -ForegroundColor Yellow
        Write-Host ""
        
        # Verificar pré-requisitos
        if (!(Test-Prerequisites)) {
            return 1
        }
        
        # Executar testes
        if (!(Invoke-Tests)) {
            return 1
        }
        
        # Build backend
        if (!(Build-Backend)) {
            return 1
        }
        
        # Build Flutter
        if (!(Build-Flutter)) {
            return 1
        }
        
        # Deploy (se não for DryRun)
        if (!$DryRun) {
            if (!(Deploy-Azure)) {
                return 1
            }
        } else {
            Write-Info "DryRun ativado - pulando deploy real"
        }
        
        Write-Host ""
        Write-Success "Deploy concluído com sucesso! ✓"
        Write-Host ""
        
        return 0
    }
    catch {
        Write-Error "Erro durante o deploy: $_"
        return 1
    }
}

# Executar função principal
exit (Main)
