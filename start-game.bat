@echo off
title Royal Hold'em Server
echo ==============================================
echo   Royal Hold'em - Luxury Poker Server
echo ==============================================
echo.
cd /d "%~dp0"
node server/server.js
pause
