# PowerShell script to create server tar.gz for VPS deployment
# Run: powershell -ExecutionPolicy Bypass -File build-server-tar.ps1

Write-Host "Building UntralView Server tar.gz..." -ForegroundColor Cyan
Write-Host ""

$serverDir = "c:\Users\Long\Desktop\UntralView\server"
$outputZip = "c:\Users\Long\Desktop\UntralView\untralview-server.zip"
$outputTar = "c:\Users\Long\Desktop\UntralView\untralview-server.tar.gz"

# Step 1: Create ZIP if doesn't exist
if (-not (Test-Path $outputZip)) {
    Write-Host "Creating zip archive..." -ForegroundColor Yellow
    Compress-Archive -Path $serverDir -DestinationPath $outputZip -Force
    Write-Host "✅ Zip created: $outputZip" -ForegroundColor Green
} else {
    Write-Host "✅ Zip already exists: $outputZip" -ForegroundColor Green
}

# Step 2: Install 7-Zip if available, try to create tar.gz
$sevenZipPath = "C:\Program Files\7-Zip\7z.exe"
$sevenZipPath32 = "C:\Program Files (x86)\7-Zip\7z.exe"

if (Test-Path $sevenZipPath) {
    Write-Host "Found 7-Zip, creating tar.gz..." -ForegroundColor Yellow
    & $sevenZipPath a -ttar -so $outputTar $serverDir | Out-Null
    Write-Host "✅ Tar.gz created: $outputTar" -ForegroundColor Green
} elseif (Test-Path $sevenZipPath32) {
    Write-Host "Found 7-Zip (32-bit), creating tar.gz..." -ForegroundColor Yellow
    & $sevenZipPath32 a -ttar -so $outputTar $serverDir | Out-Null
    Write-Host "✅ Tar.gz created: $outputTar" -ForegroundColor Green
} else {
    Write-Host "7-Zip not found, using zip instead" -ForegroundColor Yellow
    Write-Host "To create tar.gz on Linux:"
    Write-Host "  tar -czf untralview-server.tar.gz server/" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Package contents:" -ForegroundColor Cyan
Get-ChildItem $serverDir -Recurse | Measure-Object | ForEach-Object { Write-Host "  Files: $($_.Count)" }
(Get-ChildItem $outputZip).Length | ForEach-Object { Write-Host "  Zip size: $(($_ / 1MB).ToString("F2")) MB" }

if (Test-Path $outputTar) {
    (Get-ChildItem $outputTar).Length | ForEach-Object { Write-Host "  Tar.gz size: $(($_ / 1MB).ToString("F2")) MB" }
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Upload untralview-server.zip to your VPS" -ForegroundColor White
Write-Host "2. On VPS, run:" -ForegroundColor White
Write-Host "   unzip untralview-server.zip" -ForegroundColor Yellow
Write-Host "   tar -czf untralview-server.tar.gz server/" -ForegroundColor Yellow
Write-Host "   rm untralview-server.zip" -ForegroundColor Yellow
Write-Host "3. Then extract and run:" -ForegroundColor White
Write-Host "   tar -xzf untralview-server.tar.gz" -ForegroundColor Yellow
Write-Host "   cd server && npm install && npm start" -ForegroundColor Yellow
