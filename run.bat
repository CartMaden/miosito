@echo off

echo Avvio Docker Desktop...
start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"

echo Attendo che Docker sia pronto...
:loop
docker info >nul 2>&1
if %errorlevel% neq 0 (
    timeout /t 2 >nul
    goto loop
)

echo Docker pronto!

docker compose up -d
start http://localhost:8080