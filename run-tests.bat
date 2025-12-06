@echo off
echo Cleaning up...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 3 >nul
if exist .next\dev\lock del /f .next\dev\lock >nul 2>&1
if exist .next rmdir /s /q .next >nul 2>&1

echo Starting dev server...
start /B cmd /c "npm run dev > dev-server.log 2>&1"
timeout /t 15 >nul

echo Running Playwright tests...
npx playwright test --project=chromium --max-failures=5

echo.
echo Tests complete! Check results above.
pause
