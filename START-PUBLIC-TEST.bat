@echo off
cd /d "%~dp0"
echo.
echo  HulkLives - publik testlank
echo  ==========================
echo.

curl -s -o NUL http://127.0.0.1:3000/ >nul 2>&1
if errorlevel 1 (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stanger gammal process pa port 3000...
    taskkill /PID %%a /F >nul 2>&1
  )
  timeout /t 2 /nobreak >nul
  echo  1. Startar spelet pa port 3000...
  start "HulkLives Server" cmd /k "cd /d %~dp0 && node server.js"
  timeout /t 5 /nobreak >nul
) else (
  echo  Server kors redan pa port 3000 - bra!
)

curl -s -o NUL http://127.0.0.1:3000/ >nul 2>&1
if errorlevel 1 (
  echo.
  echo  FEL: Spelet svarar inte pa localhost:3000
  echo  Kolla fonstret "HulkLives Server" efter fel.
  pause
  exit /b 1
)

echo  2. Startar Cloudflare Tunnel...
echo.
echo  VANTA tills du ser:
echo    - https://....trycloudflare.com
echo    - Registered tunnel connection
echo.
echo  Testa FORST: http://localhost:3000
echo  Testa SEDAN: trycloudflare-lanken
echo  Stang INTE fonstren medan folk spelar.
echo.

npx --yes cloudflared tunnel --url http://127.0.0.1:3000

pause
