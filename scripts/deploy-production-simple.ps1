# Deploy Script Simples para Backend
[CmdletBinding()]
param(
    [string]$Environment = 'production',
    [switch]$BackendOnly = $false
)

$ErrorActionPreference = 'Stop'
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptPath
$BackendDir = Join-Path $ProjectRoot 'backend'

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

function Write-Error { 
    param($msg) 
    Write-Host '[ERROR] ' -ForegroundColor Red -NoNewline
    Write-Host $msg
    exit 1 
}

Write-Host '========================================'
Write-Host '  Deploy Backend - Quem Mente Menos?'
Write-Host '========================================'
Write-Host 'Ambiente: ' -NoNewline
Write-Host $Environment -ForegroundColor Yellow

# Verificar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error 'Node.js não está instalado'
}

Write-Info 'Iniciando build do backend...'
Push-Location $BackendDir
try {
    # Instalar dependências se necessário
    if (!(Test-Path 'node_modules')) {
        Write-Info 'Instalando dependências...'
        npm ci
    }
    
    # Build
    Write-Info 'Compilando TypeScript...'
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success 'Backend construído com sucesso!'
    } else {
        Write-Error 'Falha no build do backend'
    }
}
catch {
    Write-Error "Erro: $($_.Exception.Message)"
}
finally {
    Pop-Location
}

Write-Success 'Deploy concluído!'
