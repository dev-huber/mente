@echo off
echo ========================================
echo   Deploy Backend - Quem Mente Menos?
echo ========================================
echo.

REM Executar o script PowerShell com as permissões corretas
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0scripts\deploy-production.ps1' -Environment production -BackendOnly -SkipTests:$false"

pause
