# PowerShell script to run the Steelers GamePlan application
# This script starts a local Python HTTP server to serve the application

Write-Host "🏈 Starting Steelers GamePlan Server..." -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Yellow

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.x" -ForegroundColor Red
    Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    pause
    exit 1
}

# Get the current directory
$currentDir = Get-Location
Write-Host "📁 Serving from: $currentDir" -ForegroundColor Cyan

# Start the HTTP server
Write-Host "🚀 Starting server on http://localhost:8000" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "🏠 Main App:    http://localhost:8000/" -ForegroundColor White
Write-Host "🔒 Admin Panel: http://localhost:8000/admin.html" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Yellow

# Start the Python HTTP server
try {
    python -m http.server 8000
} catch {
    Write-Host "❌ Failed to start server" -ForegroundColor Red
    Write-Host "   Make sure no other service is using port 8000" -ForegroundColor Yellow
    pause
}