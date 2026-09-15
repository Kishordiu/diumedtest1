$ErrorActionPreference = "Stop"

$sourcePath = ".\kaggle.json"
$targetDir = "$env:USERPROFILE\.kaggle"
$targetPath = "$targetDir\kaggle.json"

if (-not (Test-Path $sourcePath)) {
    Write-Host "ERROR: kaggle.json not found in the current directory!" -ForegroundColor Red
    Write-Host "Please go to Kaggle.com -> Settings -> Create New API Token, download the kaggle.json file, and place it in the diumed12 folder." -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $targetDir)) {
    Write-Host "Creating $targetDir directory..."
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
}

Write-Host "Copying kaggle.json to $targetDir..."
Copy-Item -Path $sourcePath -Destination $targetPath -Force

Write-Host "Kaggle authentication successfully configured!" -ForegroundColor Green
Write-Host "You can now run: python research\download_clinical_data.py" -ForegroundColor Cyan
