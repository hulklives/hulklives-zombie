@echo off
cd /d "%~dp0"
echo.
echo  HulkLives - starta om BARA tunneln
echo  ==================================
echo.

curl -s -o NUL http://127.0.0.1:3000/ >nul 2>&1
if errorlevel 1 (
  echo  FEL: Spelet kors inte. Kor START-PUBLIC-TEST.bat istallet.
  pause
  exit /b 1
)

echo  Server OK pa localhost:3000
echo  Startar ny tunnel (ny lank varje gang)...
echo.

npx --yes cloudflared tunnel --url http://127.0.0.1:3000

pause
