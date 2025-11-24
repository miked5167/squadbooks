@echo off
echo ==================================================
echo   Supabase Edge Function Deployment
echo ==================================================
echo.
echo This will deploy the run-daily-snapshots function
echo to your Supabase project: vynfjwduiehdwbfwyqzh
echo.
echo You need a Supabase access token from:
echo https://supabase.com/dashboard/account/tokens
echo.
set /p TOKEN="Paste your access token (starts with sbp_): "

if "%TOKEN%"=="" (
    echo Error: No token provided
    exit /b 1
)

echo.
echo Setting token...
set SUPABASE_ACCESS_TOKEN=%TOKEN%

echo Linking project...
npx supabase link --project-ref vynfjwduiehdwbfwyqzh

if errorlevel 1 (
    echo Error: Failed to link project
    exit /b 1
)

echo.
echo Deploying Edge Function...
npx supabase functions deploy run-daily-snapshots

if errorlevel 1 (
    echo Error: Failed to deploy
    exit /b 1
)

echo.
echo ==================================================
echo   Deployment Complete!
echo ==================================================
echo.
echo Function URL:
echo https://vynfjwduiehdwbfwyqzh.supabase.co/functions/v1/run-daily-snapshots
echo.
echo Next: Configure environment variables in Supabase Dashboard
echo.
pause
