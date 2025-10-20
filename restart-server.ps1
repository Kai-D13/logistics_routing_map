# ============================================================
# RESTART SERVER SCRIPT
# Kills old Node.js processes on port 5000 and starts new server
# ============================================================

Write-Host "`n🔧 RESTARTING SERVER...`n" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray

# Step 1: Kill processes using port 5000
Write-Host "`n📍 Step 1: Checking port 5000..." -ForegroundColor Yellow

try {
    $connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    
    if ($connections) {
        Write-Host "   ⚠️  Port 5000 is in use. Killing processes..." -ForegroundColor Yellow
        
        $connections | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object {
            $processId = $_
            $processName = (Get-Process -Id $processId -ErrorAction SilentlyContinue).ProcessName
            
            Write-Host "   Killing process: $processName (PID: $processId)" -ForegroundColor Red
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        
        Write-Host "   ✅ Port 5000 freed!" -ForegroundColor Green
        Start-Sleep -Seconds 1
    } else {
        Write-Host "   ✅ Port 5000 is available" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Could not check port. Trying to kill all node.exe..." -ForegroundColor Yellow
    taskkill /IM node.exe /F 2>$null
    Start-Sleep -Seconds 1
}

# Step 2: Verify port is free
Write-Host "`n📍 Step 2: Verifying port is free..." -ForegroundColor Yellow

$portCheck = netstat -ano | findstr ":5000"
if ($portCheck) {
    Write-Host "   ❌ Port 5000 still in use!" -ForegroundColor Red
    Write-Host "   Please manually kill the process:" -ForegroundColor Red
    Write-Host "   $portCheck" -ForegroundColor Gray
    exit 1
} else {
    Write-Host "   ✅ Port 5000 is free!" -ForegroundColor Green
}

# Step 3: Start server
Write-Host "`n📍 Step 3: Starting server..." -ForegroundColor Yellow
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

node backend/server.js

