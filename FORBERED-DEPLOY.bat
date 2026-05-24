@echo off
cd /d "%~dp0"
set "GIT=C:\Program Files\Git\bin\git.exe"
if not exist "%GIT%" set "GIT=git"

echo.
echo  Forbereder projekt for GitHub + Render...
echo.

"%GIT%" init
"%GIT%" add .
"%GIT%" status

echo.
echo  Klart att committa. Kor sedan:
echo    git commit -m "HulkLives Zombie Survival"
echo.
echo  Skapa repo pa github.com och pusha.
echo  Sedan: render.com - New Web Service - koppla repot.
echo.
pause
