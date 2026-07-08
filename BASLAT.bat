@echo off
cd /d "%~dp0"
start "Solid Workflow Studio" cmd /k "cd /d %~dp0 && ""C:\Program Files\nodejs\node.exe"" apps\backend\src\server.js"
timeout /t 2 /nobreak >nul
start "" http://127.0.0.1:3000
