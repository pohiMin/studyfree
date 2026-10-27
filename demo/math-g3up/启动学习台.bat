@echo off
chcp 65001 >nul
title 三年级数学学习台 · 本地服务
cd /d "%~dp0out"

set "PY="
where python >nul 2>nul && set "PY=python"
if "%PY%"=="" if exist "%USERPROFILE%\.workbuddy\binaries\python\versions\3.13.12\python.exe" set "PY=%USERPROFILE%\.workbuddy\binaries\python\versions\3.13.12\python.exe"
if "%PY%"=="" if exist "C:\Users\10061\.workbuddy\binaries\python\versions\3.13.12\python.exe" set "PY=C:\Users\10061\.workbuddy\binaries\python\versions\3.13.12\python.exe"

if "%PY%"=="" (
  echo.
  echo 找不到 Python。
  echo 可以改成直接双击 out\index.html 打开，资源库视频可能无法内嵌播放。
  echo.
  pause
  exit /b
)

echo.
echo   学习台已启动：http://127.0.0.1:8899/index.html
echo   关闭这个窗口即停止服务
echo.

start "" "http://127.0.0.1:8899/index.html"
"%PY%" -m http.server 8899
