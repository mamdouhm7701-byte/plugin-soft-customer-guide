@echo off
cd /d "%~dp0"
node scripts/local-preview.mjs
if errorlevel 1 pause
