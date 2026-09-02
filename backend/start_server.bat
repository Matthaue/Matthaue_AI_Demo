@echo off
chcp 65001 >nul
cd /d "%~dp0"
title Valorant 补位急救站 - 社群数据后端

echo.
echo   正在启动后端服务（零依赖，只需 Python 标准库）...
echo.

rem ---- 定位 Python ----
set "PY="
where python >nul 2>nul && set "PY=python"
if not defined PY (where py >nul 2>nul && set "PY=py")
if not defined PY (
    echo   [错误] 未检测到 Python，请先安装 Python 3.8+ 并勾选 "Add to PATH"
    echo          或手动运行： python backend/server.py
    echo.
    pause
    exit /b 1
)

rem ---- 数据库不存在则先生成 ----
if not exist "..\valorant_community.db" (
    echo   首次运行：正在从 SQL 脚本生成数据库...
    %PY% init_db.py
    echo.
)

echo   服务启动后，打开工作台 -^> 社群投稿 -^> 数据源选「后端数据库 SQLite」
echo   停止服务：关闭本窗口 或 按 Ctrl + C
echo.
%PY% server.py
pause
