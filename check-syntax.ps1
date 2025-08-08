# Script para verificar sintaxe PowerShell
param($FilePath)

Write-Host "Verificando sintaxe de: $FilePath" -ForegroundColor Yellow

try {
    $content = Get-Content $FilePath -Raw
    $errors = $null
    $tokens = $null
    $ast = [System.Management.Automation.Language.Parser]::ParseInput($content, [ref]$tokens, [ref]$errors)
    
    if ($errors.Count -eq 0) {
        Write-Host "✅ Sintaxe OK!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erros encontrados:" -ForegroundColor Red
        foreach ($error in $errors) {
            Write-Host "Linha $($error.Extent.StartLineNumber): $($error.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}
