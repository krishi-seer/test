@echo off
echo Starting Krishi-Seer in Development Mode...

:: Kill any existing process on port 3000
taskkill /F /IM "node.exe" /FI "WINDOWTITLE eq next*" > nul 2>&1

:: Set development optimizations
set NEXT_RUNTIME_NODE_ENV=development
set NEXT_TELEMETRY_DISABLED=1
set NEXT_MINIMAL=1

:: Start the development server with optimizations
echo Starting optimized development server...
start "" npm run dev -- -p 3000

:: Wait for server to start
timeout /t 2 /nobreak > nul

:: Open in default browser
start http://localhost:3000

echo Development server is running on http://localhost:3000