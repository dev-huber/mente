# Script para verificar status dos recursos Azure
# Sem precisar instalar Azure CLI ou Terraform

param(
    [string]$SubscriptionId = $null
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  Verificação de Status - Azure Resources" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# URLs dos endpoints conhecidos do projeto
$endpoints = @(
    "https://func-quem-mente-menos.azurewebsites.net/api/health",
    "https://func-quem-mente-menos-staging.azurewebsites.net/api/health",
    "https://func-quem-mente-menos-development.azurewebsites.net/api/health"
)

Write-Host "`n[INFO] Verificando endpoints conhecidos..." -ForegroundColor Yellow

foreach ($endpoint in $endpoints) {
    Write-Host "`nTestando: $endpoint" -ForegroundColor Gray
    
    try {
        $response = Invoke-WebRequest -Uri $endpoint -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ ONLINE - Status: $($response.StatusCode)" -ForegroundColor Green
        
        # Tentar extrair informações da resposta
        if ($response.Content) {
            $content = $response.Content | ConvertFrom-Json -ErrorAction SilentlyContinue
            if ($content) {
                Write-Host "   Version: $($content.version)" -ForegroundColor Cyan
                Write-Host "   Status: $($content.status)" -ForegroundColor Cyan
            }
        }
    }
    catch {
        if ($_.Exception.Message -like "*Este host não é conhecido*" -or $_.Exception.Message -like "*could not be resolved*") {
            Write-Host "❌ OFFLINE - DNS não resolve" -ForegroundColor Red
        }
        elseif ($_.Exception.Message -like "*timeout*") {
            Write-Host "⏱️ TIMEOUT - Pode estar lento" -ForegroundColor Yellow
        }
        else {
            Write-Host "❌ ERRO - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Verificar se temos informações sobre Resource Groups
Write-Host "`n[INFO] Verificando configurações locais..." -ForegroundColor Yellow

$expectedResourceGroups = @(
    "rg-quem-mente-menos-production",
    "rg-quem-mente-menos-staging", 
    "rg-quem-mente-menos-development",
    "rg-terraform-state"
)

Write-Host "Resource Groups esperados:" -ForegroundColor Cyan
foreach ($rg in $expectedResourceGroups) {
    Write-Host "  - $rg" -ForegroundColor Gray
}

# Verificar arquivos de configuração
Write-Host "`n[INFO] Arquivos de configuração:" -ForegroundColor Yellow

$configFiles = @{
    "Azure Profile" = "$env:USERPROFILE\.azure\azureProfile.json"
    "Terraform State" = ".\terraform\terraform.tfstate"
    "Terraform Vars" = ".\terraform\terraform.tfvars"
    "Environment Vars" = ".\.env"
}

foreach ($file in $configFiles.GetEnumerator()) {
    $exists = Test-Path $file.Value
    $status = if ($exists) { "✅ Existe" } else { "❌ Não encontrado" }
    Write-Host "  $($file.Key): $status" -ForegroundColor $(if ($exists) { "Green" } else { "Red" })
}

Write-Host "`n[INFO] Próximos passos recomendados:" -ForegroundColor Yellow
Write-Host "1. Se endpoints estão offline: Executar deploy" -ForegroundColor Cyan
Write-Host "2. Se DNS não resolve: Recursos podem não existir" -ForegroundColor Cyan
Write-Host "3. Instalar Azure CLI para verificação completa" -ForegroundColor Cyan
Write-Host "4. Executar terraform plan para ver estado atual" -ForegroundColor Cyan

Write-Host "`n=========================================="
