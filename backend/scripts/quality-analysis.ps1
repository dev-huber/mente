# Script de Análise de Qualidade do Código
# Implementa as práticas recomendadas do artigo sobre análise estática

Write-Host "🔍 ANÁLISE DE QUALIDADE DE CÓDIGO - QUEM MENTE MENOS BACKEND" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

$startTime = Get-Date
$issuesFound = 0

# Função para executar comandos e capturar resultados
function Run-Analysis {
    param(
        [string]$Command,
        [string]$Description,
        [switch]$ContinueOnError
    )
    
    Write-Host "`n📊 $Description..." -ForegroundColor Yellow
    try {
        $result = Invoke-Expression $Command 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description - OK" -ForegroundColor Green
            if ($result) { Write-Host $result -ForegroundColor Gray }
        } else {
            Write-Host "❌ $Description - ISSUES FOUND" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            $script:issuesFound++
            if (-not $ContinueOnError) { 
                throw "Analysis failed: $Description" 
            }
        }
    } catch {
        Write-Host "❌ $Description - ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $script:issuesFound++
        if (-not $ContinueOnError) { throw }
    }
}

# 1. TypeScript Compilation Check
Run-Analysis "npm run build" "TypeScript Compilation"

# 2. ESLint Analysis (Security, Quality, Complexity)
Run-Analysis "npm run lint" "ESLint Code Quality Analysis" -ContinueOnError

# 3. Dependency Analysis (Circular Dependencies, Orphans)
Write-Host "`n📊 Dependency Analysis..." -ForegroundColor Yellow
try {
    $depResult = npm run analyze:deps 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependency Analysis - No Issues" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Dependency Issues Found:" -ForegroundColor Yellow
        Write-Host $depResult -ForegroundColor Yellow
        $script:issuesFound++
    }
} catch {
    Write-Host "❌ Dependency Analysis Failed: $($_.Exception.Message)" -ForegroundColor Red
    $script:issuesFound++
}

# 4. Unused Exports Detection
Write-Host "`n📊 Unused Exports Analysis..." -ForegroundColor Yellow
try {
    $unusedResult = npm run analyze:unused 2>&1
    if ($unusedResult -and $unusedResult.Length -gt 0) {
        Write-Host "⚠️  Unused Exports Found:" -ForegroundColor Yellow
        Write-Host $unusedResult -ForegroundColor Yellow
        $script:issuesFound++
    } else {
        Write-Host "✅ No Unused Exports" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Unused Exports Analysis Failed: $($_.Exception.Message)" -ForegroundColor Red
    $script:issuesFound++
}

# 5. Test Coverage Analysis
Run-Analysis "npm run test:coverage" "Test Coverage Analysis" -ContinueOnError

# 6. Security Analysis
Write-Host "`n🔒 Security Analysis..." -ForegroundColor Yellow
Write-Host "   Checking for common security issues..." -ForegroundColor Gray

# Check for hardcoded secrets (basic patterns)
$securityIssues = @()
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts"
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "(password|secret|key|token)\s*[:=]\s*['\"`][^'`\"]{8,}['\"`]") {
        $securityIssues += "Potential hardcoded secret in: $($file.Name)"
    }
}

if ($securityIssues.Count -gt 0) {
    Write-Host "⚠️  Security Issues Found:" -ForegroundColor Yellow
    $securityIssues | ForEach-Object { Write-Host "   $_" -ForegroundColor Yellow }
    $script:issuesFound++
} else {
    Write-Host "✅ No Obvious Security Issues" -ForegroundColor Green
}

# 7. Code Metrics Summary
Write-Host "`n📈 Code Metrics Summary..." -ForegroundColor Yellow

# Count lines of code
$tsFiles = Get-ChildItem -Path "src" -Recurse -Include "*.ts"
$totalLines = 0
$totalFiles = 0

foreach ($file in $tsFiles) {
    $lines = (Get-Content $file.FullName).Count
    $totalLines += $lines
    $totalFiles++
}

Write-Host "   Total TypeScript Files: $totalFiles" -ForegroundColor White
Write-Host "   Total Lines of Code: $totalLines" -ForegroundColor White
Write-Host "   Average Lines per File: $([math]::Round($totalLines / $totalFiles, 2))" -ForegroundColor White

# Check coverage if exists
if (Test-Path "coverage/lcov-report/index.html") {
    Write-Host "   Coverage Report: coverage/lcov-report/index.html" -ForegroundColor White
} else {
    Write-Host "   Coverage Report: Not generated" -ForegroundColor Gray
}

# 8. Performance Recommendations
Write-Host "`n⚡ Performance Recommendations..." -ForegroundColor Yellow

# Check for large files
$largeFiles = $tsFiles | Where-Object { (Get-Content $_.FullName).Count -gt 300 }
if ($largeFiles.Count -gt 0) {
    Write-Host "⚠️  Large files found (>300 lines):" -ForegroundColor Yellow
    $largeFiles | ForEach-Object { 
        $lines = (Get-Content $_.FullName).Count
        Write-Host "   $($_.Name): $lines lines" -ForegroundColor Yellow 
    }
    $script:issuesFound++
} else {
    Write-Host "✅ No overly large files" -ForegroundColor Green
}

# 9. Documentation Check
Write-Host "`n📚 Documentation Check..." -ForegroundColor Yellow

$readmeExists = Test-Path "README.md"
$packageJsonExists = Test-Path "package.json"
$tsConfigExists = Test-Path "tsconfig.json"

Write-Host "   README.md: $(if($readmeExists){'✅'}else{'❌'})" -ForegroundColor $(if($readmeExists){'Green'}else{'Red'})
Write-Host "   package.json: $(if($packageJsonExists){'✅'}else{'❌'})" -ForegroundColor $(if($packageJsonExists){'Green'}else{'Red'})
Write-Host "   tsconfig.json: $(if($tsConfigExists){'✅'}else{'❌'})" -ForegroundColor $(if($tsConfigExists){'Green'}else{'Red'})

# Final Report
$endTime = Get-Date
$duration = $endTime - $startTime

Write-Host "`n" -NoNewline
Write-Host "🎯 RELATÓRIO FINAL DE QUALIDADE" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "⏱️  Tempo de análise: $($duration.TotalSeconds.ToString('F2'))s" -ForegroundColor White
Write-Host "📝 Issues encontrados: $issuesFound" -ForegroundColor $(if($issuesFound -eq 0){'Green'}else{'Yellow'})

if ($issuesFound -eq 0) {
    Write-Host "`n🎉 PARABÉNS! Código com excelente qualidade!" -ForegroundColor Green
    Write-Host "   ✅ Compilação limpa" -ForegroundColor Green
    Write-Host "   ✅ Sem dependências circulares" -ForegroundColor Green  
    Write-Host "   ✅ Sem exports não utilizados" -ForegroundColor Green
    Write-Host "   ✅ Sem issues de segurança óbvios" -ForegroundColor Green
    Write-Host "   ✅ Arquivos de tamanho adequado" -ForegroundColor Green
} elseif ($issuesFound -le 3) {
    Write-Host "`n⚠️  Qualidade BOA - alguns issues menores encontrados" -ForegroundColor Yellow
    Write-Host "   Recomenda-se revisar e corrigir os issues identificados" -ForegroundColor Yellow
} else {
    Write-Host "`n🔴 Qualidade PRECISA MELHORAR - múltiplos issues encontrados" -ForegroundColor Red
    Write-Host "   É recomendado corrigir os issues antes de fazer deploy" -ForegroundColor Red
}

Write-Host "`n📊 Para análise mais detalhada, considere:" -ForegroundColor Cyan
Write-Host "   • SonarQube para métricas avançadas" -ForegroundColor White
Write-Host "   • Configurar CI/CD com quality gates" -ForegroundColor White
Write-Host "   • Implementar pre-commit hooks" -ForegroundColor White

exit $issuesFound