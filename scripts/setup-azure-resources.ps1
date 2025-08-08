# Setup inicial dos recursos Azure para "Quem Mente Menos?"
# Execute apenas uma vez antes do primeiro deploy

[CmdletBinding()]
param(
    [Parameter(Mandatory=$true)]
    [string]$SubscriptionId,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "brazilsouth"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Azure - Quem Mente Menos?" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Login no Azure
Write-Host "Fazendo login no Azure..." -ForegroundColor Yellow
az login

# Selecionar subscription
az account set --subscription $SubscriptionId

# Criar Resource Groups
Write-Host "Criando Resource Groups..." -ForegroundColor Yellow

$environments = @("production", "staging", "development")

foreach ($env in $environments) {
    $rgName = "rg-quem-mente-menos-$env"
    
    Write-Host "Criando RG: $rgName"
    az group create `
        --name $rgName `
        --location $Location `
        --tags "Environment=$env" "Project=QuemMenteMenos" "ManagedBy=Terraform"
}

# Criar Storage Account para Terraform State
Write-Host "Criando Storage Account para Terraform State..." -ForegroundColor Yellow

$stateRgName = "rg-terraform-state"
$stateStorageName = "stterraformstate$(Get-Random -Maximum 9999)"

az group create --name $stateRgName --location $Location

az storage account create `
    --name $stateStorageName `
    --resource-group $stateRgName `
    --location $Location `
    --sku Standard_LRS `
    --encryption-services blob

# Criar container para state
$stateContainer = "tfstate"
$storageKey = $(az storage account keys list `
    --resource-group $stateRgName `
    --account-name $stateStorageName `
    --query '[0].value' -o tsv)

az storage container create `
    --name $stateContainer `
    --account-name $stateStorageName `
    --account-key $storageKey

# Criar Service Principal para CI/CD
Write-Host "Criando Service Principal para CI/CD..." -ForegroundColor Yellow

$spName = "sp-quem-mente-menos-cicd"
$sp = az ad sp create-for-rbac `
    --name $spName `
    --role contributor `
    --scopes "/subscriptions/$SubscriptionId" `
    --sdk-auth | ConvertFrom-Json

# Salvar credenciais em arquivo seguro
$credentialsPath = Join-Path $PSScriptRoot "azure-credentials.json"
$sp | ConvertTo-Json | Out-File $credentialsPath -Encoding UTF8

# Criar Key Vault para secrets
Write-Host "Criando Key Vaults..." -ForegroundColor Yellow

foreach ($env in $environments) {
    $kvName = "kv-qmm-$env-$(Get-Random -Maximum 999)"
    $rgName = "rg-quem-mente-menos-$env"
    
    Write-Host "Criando Key Vault: $kvName"
    az keyvault create `
        --name $kvName `
        --resource-group $rgName `
        --location $Location `
        --enable-soft-delete true `
        --retention-days 7
    
    # Dar permissões ao Service Principal
    az keyvault set-policy `
        --name $kvName `
        --spn $sp.appId `
        --secret-permissions get list
}

# Output das informações importantes
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Concluído!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "INFORMAÇÕES IMPORTANTES:" -ForegroundColor Yellow
Write-Host "------------------------"
Write-Host "Subscription ID: $SubscriptionId"
Write-Host "Storage Account (State): $stateStorageName"
Write-Host "Service Principal: $spName"
Write-Host "Credenciais salvas em: $credentialsPath"
Write-Host ""
Write-Host "PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Configure os secrets no GitHub:"
Write-Host "   - AZURE_CREDENTIALS: (conteúdo de $credentialsPath)"
Write-Host "   - AZURE_SUBSCRIPTION_ID: $SubscriptionId"
Write-Host "2. Atualize o backend do Terraform em terraform/main.tf:"
Write-Host "   - storage_account_name = '$stateStorageName'"
Write-Host "3. Execute o script de deploy"
Write-Host ""
Write-Host "IMPORTANTE: Guarde o arquivo $credentialsPath em local seguro!" -ForegroundColor Red
