# Quick Deploy Script - Apenas Backend
# Para deploys rápidos quando Flutter não está disponível

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "production"
)

# Verificar se o script principal existe
$mainScript = Join-Path $PSScriptRoot "deploy-production-simple.ps1"
if (!(Test-Path $mainScript)) {
    Write-Host "Erro: Script deploy-production-simple.ps1 não encontrado!" -ForegroundColor Red
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Quick Deploy Backend - Quem Mente Menos?" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ambiente: $Environment" -ForegroundColor Yellow
Write-Host "Modo: Backend Only (sem Flutter)" -ForegroundColor Yellow
Write-Host ""

# Executar deploy principal com flags apropriadas
try {
    & $mainScript -Environment $Environment -BackendOnly
}
catch {
    Write-Host "Erro durante o deploy: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Para instalar o Flutter e fazer deploy completo:" -ForegroundColor Yellow
Write-Host "1. Baixe Flutter: https://flutter.dev/docs/get-started/install/windows" -ForegroundColor Yellow
Write-Host "2. Execute: .\scripts\deploy-production.ps1 -Environment $Environment" -ForegroundColor Yellow
