# Script Simplificado de Deploy - Quem Mente Menos?
# Execute: .\deploy.ps1

param(
    [string]$Env = "production"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Deploy Backend - Quem Mente Menos?" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$backendDir = ".\backend"
$zipFile = ".\backend-$Env.zip"

# Verificar Node.js
Write-Host "[INFO] Verificando Node.js..." -ForegroundColor Yellow
node --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERRO] Node.js não instalado!" -ForegroundColor Red
    exit 1
}

# Entrar na pasta backend
Set-Location $backendDir

# Instalar dependências
Write-Host "[INFO] Instalando dependências..." -ForegroundColor Yellow
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "[AVISO] Erro ao instalar dependências" -ForegroundColor Yellow
}

# Build
Write-Host "[INFO] Compilando TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[AVISO] Erro no build" -ForegroundColor Yellow
}

# Voltar para raiz
Set-Location ..

# Criar ZIP
Write-Host "[INFO] Criando arquivo ZIP..." -ForegroundColor Yellow
if (Test-Path $zipFile) {
    Remove-Item $zipFile
}

Compress-Archive -Path "$backendDir\*" -DestinationPath $zipFile -Force

if (Test-Path $zipFile) {
    $size = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
    Write-Host ""
    Write-Host "[SUCESSO] Deploy package criado!" -ForegroundColor Green
    Write-Host "Arquivo: $zipFile ($size MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Para fazer deploy no Azure:" -ForegroundColor Yellow
    Write-Host "1. Acesse https://portal.azure.com" -ForegroundColor White
    Write-Host "2. Procure por 'func-quem-mente-menos-$Env'" -ForegroundColor White
    Write-Host "3. Vá em Deployment Center > Manual Deploy" -ForegroundColor White
    Write-Host "4. Faça upload do arquivo $zipFile" -ForegroundColor White
} else {
    Write-Host "[ERRO] Falha ao criar ZIP" -ForegroundColor Red
}
