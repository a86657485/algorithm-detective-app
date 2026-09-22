@echo off
chcp 65001 >nul
title AlgoDetective Classroom - open firewall port 3001

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo   Need administrator rights. A UAC prompt will pop up, please click Yes.
  echo.
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

echo.
echo ==================================================================
echo   Opening inbound TCP port 3001 (permanent rule)
echo ==================================================================
echo.

powershell -NoProfile -Command "$n='AlgoDetective Class Server (TCP 3001)'; Remove-NetFirewallRule -DisplayName $n -ErrorAction SilentlyContinue; New-NetFirewallRule -DisplayName $n -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Any -ErrorAction Stop | Out-Null; Get-NetFirewallRule -DisplayName $n | Select-Object DisplayName,Enabled,Direction,Action,Profile | Format-List"

if errorlevel 1 (
  echo.
  echo   [FAILED] Could not add the firewall rule.
) else (
  echo.
  echo   [OK] Port 3001 is now open. It will stay open after reboot.
  echo        Students can visit:  http://YOUR-TEACHER-IP:3001/
)

echo.
echo   You can close this window now.
pause
