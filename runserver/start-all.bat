@echo off
rem Double-click this file to start backend, frontend, and the kakao bot,
rem each in its own window. Close a window (or press Ctrl+C in it) to stop that one.
rem
rem NOTE: this calls each project's venv python.exe directly instead of "activate.bat" +
rem bare "python", because kakao's .venv was originally created at a different folder
rem path and copied here - its activate.bat still points at that old path, so plain
rem "python" after activating would silently resolve to the wrong (system) interpreter.
rem Calling <venv>\Scripts\python.exe directly sidesteps that entirely.

rem Refresh PATH from the registry in case Node.js (or anything else) was installed
rem after this terminal/session started, so "npm" can still be found without a reboot.
for /f "usebackq tokens=2,*" %%A in (`reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path`) do set "SYS_PATH=%%B"
for /f "usebackq tokens=2,*" %%A in (`reg query "HKCU\Environment" /v Path 2^>nul`) do set "USER_PATH=%%B"
set "PATH=%SYS_PATH%;%USER_PATH%;%PATH%"

set "ROOT=%~dp0.."

echo [1/3] starting backend on http://localhost:8000
start "backend (localhost:8000)" cmd /k "cd /d "%ROOT%\backend" && "%ROOT%\backend\.venv\Scripts\python.exe" -m uvicorn main:app --reload --port 8000"

timeout /t 2 /nobreak >nul

echo [2/3] starting frontend on http://localhost:5173
start "frontend (localhost:5173)" cmd /k "cd /d "%ROOT%\frontend" && npm run dev"

timeout /t 2 /nobreak >nul

echo [3/3] starting kakao notification bot (Discord + Google Calendar)
start "kakao bot (Discord + Google Calendar)" cmd /k "cd /d "%ROOT%\kakao" && "%ROOT%\kakao\.venv\Scripts\python.exe" main.py"

echo.
echo All three windows should now be open. Open http://localhost:5173 in your browser.
