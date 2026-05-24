@echo off
cd /d "%~dp0"
echo Starting HulkLives server...
echo Open: http://localhost:3000
echo Press Ctrl+C to stop.
node server.js
pause
