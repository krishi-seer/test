@echo off
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F
echo Server on port 3001 stopped.
pause
