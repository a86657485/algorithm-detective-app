@echo off
chcp 65001 >nul
title 算法小侦探事务所 - 课堂服务
cd /d "%~dp0"

echo.
echo ==================================================================
echo   算法小侦探事务所 · 课堂服务启动中
echo ==================================================================
echo.

if not exist "dist\index.html" (
  echo   [1/2] 首次运行，正在构建前端页面，请稍候...
  echo.
  call npm run build
  if errorlevel 1 (
    echo.
    echo   构建失败：请确认已经安装 Node.js 并且在项目目录里执行过 npm install
    pause
    exit /b 1
  )
) else (
  echo   [1/2] 前端已构建好，跳过构建步骤
)

echo.
echo   [2/2] 正在启动服务...
echo.
echo   ------------------------------------------------------------------
echo   启动成功后，请把下面显示的「Student devices」那一行地址
echo   （形如 http://10.x.x.x:3001/）发给学生，让他们在浏览器里打开。
echo.
echo   教师自己看数据：启动后打开 http://localhost:3001/#/dashboard
echo   教师口令：teacher
echo.
echo   * 第一次运行如果其他电脑打不开，请在 Windows 防火墙弹窗里
echo     选择「允许访问」，或者手动放行 3001 端口。
echo   * 使用期间请不要关闭这个黑色窗口。
echo   ------------------------------------------------------------------
echo.

node server\index.mjs

echo.
echo   服务已停止。
pause
