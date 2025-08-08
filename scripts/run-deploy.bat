@echo off
REM Batch file para executar deploy do "Quem Mente Menos?"
REM Facilita execução no Windows

echo ========================================
echo   Deploy - Quem Mente Menos?
echo ========================================
echo.

REM Verificar se PowerShell está disponível
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] PowerShell não encontrado!
    exit /b 1
)

REM Menu de opções
echo Selecione o ambiente de deploy:
echo 1. Production
echo 2. Staging
echo 3. Development
echo.
set /p env_choice="Digite o número (1-3): "

if "%env_choice%"=="1" (
    set ENVIRONMENT=production
) else if "%env_choice%"=="2" (
    set ENVIRONMENT=staging
) else if "%env_choice%"=="3" (
    set ENVIRONMENT=development
) else (
    echo [ERRO] Opção inválida!
    exit /b 1
)

echo.
echo Opções adicionais:
set /p skip_tests="Pular testes? (s/N): "
set /p dry_run="Executar em modo Dry Run? (s/N): "

REM Construir comando PowerShell
set PS_CMD=powershell -ExecutionPolicy Bypass -File "%~dp0deploy-production-fixed.ps1" -Environment %ENVIRONMENT%

if /i "%skip_tests%"=="s" (
    set PS_CMD=%PS_CMD% -SkipTests
)

if /i "%dry_run%"=="s" (
    set PS_CMD=%PS_CMD% -DryRun
)

echo.
echo Executando: %PS_CMD%
echo.

REM Executar deploy
%PS_CMD%

REM Verificar resultado
if %errorlevel% equ 0 (
    echo.
    echo [SUCESSO] Deploy concluído!
) else (
    echo.
    echo [ERRO] Deploy falhou com código: %errorlevel%
)

pause
