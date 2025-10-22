# Add to PowerShell Profile to always use Node.js v22
# This will run every time you open a new PowerShell terminal

# Remove old Node.js path and prioritize new one
$env:Path = $env:Path -replace 'C:\\nvm4w\\nodejs;', ''
$env:Path = $env:Path -replace ';C:\\nvm4w\\nodejs', ''

Write-Host "✅ Node.js v22 activated" -ForegroundColor Green
