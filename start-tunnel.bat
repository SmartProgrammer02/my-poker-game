@echo off
title Royal Hold'em Worldwide Tunnel
echo ==============================================
echo   Royal Hold'em - Global Online Tunnel
echo ==============================================
echo.
echo Connecting to worldwide network for USA and global friends...
echo (Look for the link ending in .trycloudflare.com below)
echo.
cd /d "%~dp0"
npx.cmd cloudflared tunnel --protocol http2 --url http://localhost:4000
pause
