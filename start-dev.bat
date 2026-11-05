@echo off
title EngineerOS Launcher
echo ===================================================
echo             EngineerOS Development Launcher
echo ===================================================
echo.

REM 0. Ensure server/.env exists
if not exist "server\.env" (
    echo [*] Creating server\.env from .env.example...
    copy "server\.env.example" "server\.env" >nul
)

REM 1. Check if configured for MongoDB Atlas or local
findstr /i "mongodb+srv" "server\.env" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Using MongoDB Atlas Cloud Database.
) else (
    REM Check if local MongoDB is running on port 27017
    netstat -ano | findstr 27017 >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [*] Starting local MongoDB instance on port 27017...
        start "EngineerOS MongoDB" /MIN "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "%~dp0data\db"
        timeout /t 3 /nobreak >nul
    ) else (
        echo [OK] Local MongoDB is active on port 27017.
    )
)

echo.
echo [*] Launching EngineerOS (API, Worker, and Client)...
echo [i] Client URL: http://localhost:3000
echo [i] API URL:    http://localhost:5000
echo.
npm run dev

