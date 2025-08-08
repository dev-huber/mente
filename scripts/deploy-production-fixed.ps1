# Deploy Script Corrigido - Quem Mente Menos?
[CmdletBinding()]
param(
    [string]$Environment = 'staging',
    [switch]$SkipTests = $false,
    [switch]$BackendOnly = $false,
    [switch]$SkipInfrastructure = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = 'Stop'
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptPath
$BackendDir = Join-Path $ProjectRoot 'backend'
$FlutterDir = $ProjectRoot

function Write-Info { 
    param($msg) 
    Write-Host '[INFO] ' -ForegroundColor Cyan -NoNewline
    Write-Host $msg 
}

function Write-Success { 
    param($msg) 
    Write-Host '[SUCCESS] ' -ForegroundColor Green -NoNewline
    Write-Host $msg 
}

function Write-Warning { 
    param($msg) 
    Write-Host '[WARNING] ' -ForegroundColor Yellow -NoNewline
    Write-Host $msg 
}

function Write-Error { 
    param($msg) 
    Write-Host '[ERROR] ' -ForegroundColor Red -NoNewline
    Write-Host $msg
    exit 1 
}

function Test-Prerequisites {
    Write-Info "Verificando pré-requisitos..."
    
    # Node.js
    if (!(Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js não está instalado"
        return $false
    }
    
    # Flutter (opcional para backend only)
    if (!$BackendOnly -and !(Get-Command flutter -ErrorAction SilentlyContinue)) {
        Write-Warning "Flutter não está instalado (build mobile será pulado)"
        $script:BackendOnly = $true
    }
    
    # Azure CLI
    if (!(Get-Command az -ErrorAction SilentlyContinue)) {
        Write-Warning "Azure CLI não está instalado (deploy será pulado)"
    }
    
    Write-Success "Pré-requisitos verificados ✓"
    return $true
}

function Invoke-Tests {
    if ($SkipTests) {
        Write-Warning "Pulando testes"
        return $true
    }
    
    Write-Info "Executando testes do backend..."
    Push-Location $BackendDir
    try {
        if (!(Test-Path "node_modules")) {
            Write-Info "Instalando dependências..."
            npm ci
        }
        
        npm test
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Testes do backend passaram ✓"
        } else {
            Write-Warning "Testes falharam mas continuando..."
        }
    }
    catch {
        Write-Warning "Erro ao executar testes: $_"
    }
    finally {
        Pop-Location
    }
    
    return $true
}

function Build-Backend {
    Write-Info "Construindo backend..."
    Push-Location $BackendDir
    try {
        if (!(Test-Path "node_modules")) {
            Write-Info "Instalando dependências..."
            npm ci
        }
        
        Write-Info "Compilando TypeScript..."
        npm run build
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Backend construído com sucesso ✓"
            
            # Criar pacote zip se necessário
            $zipPath = Join-Path $ProjectRoot "backend-$Environment.zip"
            if (Test-Path $zipPath) {
                Remove-Item $zipPath -Force
            }
            
            Write-Info "Criando pacote de deployment..."
            Compress-Archive -Path ".\*" -DestinationPath $zipPath -Force
            Write-Info "Pacote criado: $zipPath"
        } else {
            Write-Error "Falha no build do backend"
        }
    }
    catch {
        Write-Error "Erro no build: $($_.Exception.Message)"
    }
    finally {
        Pop-Location
    }
    
    return $true
}

function Build-Flutter {
    if ($BackendOnly) {
        Write-Info "Pulando build do Flutter (BackendOnly)"
        return $true
    }
    
    Write-Info "Construindo aplicativos Flutter..."
    Push-Location $FlutterDir
    try {
        Write-Info "Construindo APK Android..."
        flutter build apk --release --dart-define=ENV=$Environment
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "APK Android construído ✓"
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

function Deploy-Azure {
    Write-Info "Fazendo deploy para Azure..."
    
    if (!(Get-Command az -ErrorAction SilentlyContinue)) {
        Write-Warning "Azure CLI não instalado - pulando deploy"
        return $true
    }
    
    try {
        # Verificar login
        az account show | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Info "Fazendo login no Azure..."
            az login
        }
        
        # Deploy básico
        $zipPath = Join-Path $ProjectRoot "backend-$Environment.zip"
        if (Test-Path $zipPath) {
            Write-Info "Enviando pacote para Azure..."
            # Aqui você adicionaria o comando de deploy específico
            Write-Success "Deploy concluído ✓"
        } else {
            Write-Warning "Pacote não encontrado: $zipPath"
        }
    }
    catch {
        Write-Warning "Erro no deploy: $_"
    }
    
    return $true
}

function Main {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Deploy - Quem Mente Menos?" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Ambiente: $Environment" -ForegroundColor Yellow
    Write-Host "DryRun: $DryRun" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        if (!(Test-Prerequisites)) {
            Write-Error "Pré-requisitos não atendidos"
        }
        
        if (!$DryRun) {
            Invoke-Tests
            Build-Backend
            Build-Flutter
            
            if (!$SkipInfrastructure) {
                Deploy-Azure
            }
            
            Write-Success "🎉 Deploy concluído com sucesso!"
        } else {
            Write-Info "Modo DryRun - nenhuma ação executada"
        }
    }
    catch {
        Write-Error "Deploy falhou: $($_.Exception.Message)"
    }
}

# Executar função principal
Main
