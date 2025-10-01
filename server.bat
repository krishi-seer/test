@echo off
setlocal EnableDelayedExpansion

:menu
if "%1"=="" (
    cls
    echo Krishi-Seer Development Server Manager
    echo =====================================
    echo.
    echo 1. Start Server
    echo 2. Stop Server
    echo 3. Restart Server
    echo 4. Exit
    echo.
    set /p choice="Enter your choice (1-4): "
) else (
    set choice=0
    if "%1"=="start" set choice=1
    if "%1"=="stop" set choice=2
    if "%1"=="restart" set choice=3
)

if "!choice!"=="1" (
    call :start_server
) else if "!choice!"=="2" (
    call :stop_server
) else if "!choice!"=="3" (
    call :restart_server
) else if "!choice!"=="4" (
    exit /b 0
) else if "!choice!"=="0" (
    echo Usage: server [start^|stop^|restart]
    echo   start   - Start the development server
    echo   stop    - Stop the development server
    echo   restart - Restart the development server
    pause
    exit /b 1
) else (
    echo Invalid choice!
    timeout /t 2 >nul
    goto menu
)

if "%1"=="" goto menu
exit /b 0

:start_server
echo.
echo Checking for running server...
for /f "tokens=2" %%a in ('tasklist ^| find /i "node.exe"') do (
    set "node_pid=%%a"
)
if defined node_pid (
    echo Server is already running [PID: !node_pid!]
    echo.
    pause
    exit /b 1
)

echo Starting development server...
echo.
echo Checking if npm is installed...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH
    echo Please install Node.js and npm first
    pause
    exit /b 1
)

echo Checking if node_modules exists...
if not exist "node_modules" (
    echo node_modules not found. Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting the development server...
start "Krishi-Seer Dev Server" cmd /k "npm run dev && pause"
echo Server starting! The application will be available at:
echo http://localhost:3000
echo.
echo Note: A new window has opened running the server.
echo Press any key to continue...
pause >nul
exit /b 0

:stop_server
echo.
echo Stopping server...
set "found_server=0"
for /f "tokens=2" %%a in ('tasklist ^| find /i "node.exe"') do (
    echo Stopping Node.js process [PID: %%a]
    taskkill /F /PID %%a >nul 2>&1
    set "found_server=1"
)
if "!found_server!"=="1" (
    echo Server stopped successfully!
) else (
    echo No running server found.
)
echo.
pause
exit /b 0

:restart_server
call :stop_server
timeout /t 2 /nobreak >nul
call :start_server
exit /b 0