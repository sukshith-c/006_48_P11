# Food Safety Inspection Portal - Quick Start Script
# Run from: food-safety-portal/ directory

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  FOOD SAFETY INSPECTION PORTAL" -ForegroundColor Green
Write-Host "  Government of India - Hackathon P11" -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check MongoDB
Write-Host "[1/3] Checking prerequisites..." -ForegroundColor Yellow
$mongoRunning = $false
try {
    $nc = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($nc) { $mongoRunning = $true }
} catch {}

if (-not $mongoRunning) {
    Write-Host "  ⚠  MongoDB not detected on port 27017." -ForegroundColor Yellow
    Write-Host "     Please start MongoDB first: mongod" -ForegroundColor Yellow
    Write-Host "     Or set MONGODB_URI in server/.env to your Atlas URI" -ForegroundColor Yellow
    Write-Host ""
}

# Start backend
Write-Host "[2/3] Starting Backend API (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; node server.js" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start frontend
Write-Host "[3/3] Starting Frontend Dev Server (port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\client'; npx vite" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Application URLs" -ForegroundColor Green
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:5000/health" -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Demo Accounts:" -ForegroundColor Green
Write-Host "  Admin:     admin@foodsafety.gov.in     / Admin@123" -ForegroundColor White
Write-Host "  Inspector: inspector@foodsafety.gov.in / Inspector@123" -ForegroundColor White
Write-Host "  Handler:   h1p@foodsafety.gov.in       / Handler@123" -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Open browser
Start-Sleep -Seconds 2
Start-Process "http://localhost:5173"
