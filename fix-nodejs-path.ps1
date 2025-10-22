# Fix Node.js PATH - Run as Administrator
# This script permanently updates the System PATH to prioritize Node.js v22

Write-Host "🔧 Fixing Node.js PATH..." -ForegroundColor Cyan

# Get current System PATH
$systemPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

# Remove old nvm4w path
$newPath = $systemPath -replace 'C:\\nvm4w\\nodejs;', ''
$newPath = $newPath -replace ';C:\\nvm4w\\nodejs', ''

# Update System PATH
[Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")

Write-Host "✅ System PATH updated!" -ForegroundColor Green
Write-Host "⚠️  Please restart PowerShell/VS Code for changes to take effect" -ForegroundColor Yellow

# Display current Node.js version
Write-Host "`n📍 Current Node.js version:" -ForegroundColor Cyan
node --version
