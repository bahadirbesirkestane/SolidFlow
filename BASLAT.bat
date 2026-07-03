@echo off
cd /d "%~dp0"
start "Solid Dosya Okuma Sunucu" cmd /k "cd /d %~dp0 && ""C:\Program Files\nodejs\node.exe"" src\server.js"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:3000
